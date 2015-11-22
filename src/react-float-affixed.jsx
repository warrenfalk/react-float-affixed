"use strict";
var React = require('react');
var Escape = require('react-escape');
var {Rect,Vec2} = require('pex-geom');

// get Rect of element in viewport coordinates
function viewportRect(element) {
    var rect = element.getBoundingClientRect();
    return new Rect(rect.left, rect.top, rect.width, rect.height);
}

// get the current size of the viewport
function viewportSize() {
    var body = document.body;
    var s = getComputedStyle(body);
    var size = new Vec2(
        body.offsetWidth + parseInt(s.marginLeft) + parseInt(s.marginRight),
        body.clientHeight
        );
    return size;
}

// represents a scheme for attaching a popup rect to an anchor rect
function AttachScheme(name,args) {
    this.name = name;
    this.fits = args.fits;
    this.calcTranslation = args.calcTranslation;
}

// given an anchor edge and a popup edge
// return the delta necessary to align the popup edge on the anchor edge
function align(aedge,pedge) {
    return aedge - pedge;
}

// given an anchor bounds and popup bounds and available space,
// return the delta required to align the popup bounds to anchor bounds according to which side has the most available space
function edgeAlignMaxSpace(amin, amax, pmin, pmax, space) {
    let rspace = space - amax;
    let lspace = amin;
    return (rspace <= lspace) ? amax - pmax : amin - pmin;
}

// given a delta, popup bounds, and available space
// return a new delta which keeps the popup bounds within the available space
function clamp(delta, pmin, pmax, space) {
    var edgemax = pmax + delta;
    var edgemin = pmin + delta;
    // nudge back into viewport if any edges fall out of bounds
    if (edgemin < 0)
        return delta - edgemin;
    else if (edgemax > space)
        return delta + (space - edgemax);
    return delta;
}

var schemes = {
    "over": new AttachScheme('over', {
        fits: (arect, psize, viewport) => psize.y <= Math.min(arect.min.y, viewport.y),
        calcTranslation: (arect, prect, viewport) => new Vec2(
            clamp(edgeAlignMaxSpace(arect.min.x, arect.max.x, prect.min.x, prect.max.x, viewport.x), prect.min.x, prect.max.x, viewport.x),
            clamp(align(arect.min.y, prect.max.y), prect.min.y, prect.max.y, viewport.y)
        ),
    }),
    "under": new AttachScheme('under', {
        fits: (arect, psize, viewport) => psize.y <= (viewport.y - arect.max.y),
        calcTranslation: (arect, prect, viewport) => new Vec2(
            clamp(edgeAlignMaxSpace(arect.min.x, arect.max.x, prect.min.x, prect.max.x, viewport.x), prect.min.x, prect.max.x, viewport.x),
            clamp(align(arect.max.y, prect.min.y), prect.min.y, prect.max.y, viewport.y)
        ),
    }),
    "left": new AttachScheme('left', {
        fits: (arect, psize, viewport) => psize.x <= Math.min(arect.min.x, viewport.x),
        calcTranslation: (arect, prect, viewport) => new Vec2(
            clamp(align(arect.min.x, prect.max.x), prect.min.x, prect.max.x, viewport.x),
            clamp(edgeAlignMaxSpace(arect.min.y, arect.max.y, prect.min.y, prect.max.y, viewport.y), prect.min.y, prect.max.y, viewport.y)
        ),
    }),
    "right": new AttachScheme('right', {
        fits: (arect, psize, viewport) => psize.x <= (viewport.x - arect.max.x),
        calcTranslation: (arect, prect, viewport) => new Vec2(
            clamp(align(arect.max.x, prect.min.x), prect.min.x, prect.max.x, viewport.x),
            clamp(edgeAlignMaxSpace(arect.min.y, arect.max.y, prect.min.y, prect.max.y, viewport.y), prect.min.y, prect.max.y, viewport.y)
        ),
    }),
}

// parses the text of an "attachment" prop into an array of scheme objects
function parseAttachmentProp(prop) {
    if (!prop)
        return [schemes.under, schemes.over, schemes.right, schemes.left];
    return prop
        .split(',')
        .map(name => schemes[name.trim()])
}

var FloatAffixed = React.createClass({
    render: function() {
        var style = this.props.style || {};
        style.position = 'absolute';
        style.transform = 'translate('+this.state.translation.x+'px,'+this.state.translation.y+'px)';
        return <Escape ref="escape" to="document" style={{overflow:'hidden'}}>
                <div
                    ref={(r)=>{this._popup = r}}
                    className="float-affixed"
                    style={style}
                    {...this.props}
                    >
                    {this.props.children}
                </div>
            </Escape>
    },
    propTypes: {
        anchor: React.PropTypes.func,
        attachment: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.arrayOf(React.PropTypes.string),
        ]),
        style: React.PropTypes.object,
    },
    getInitialState: function() {
        return {
            translation: new Vec2(0,0),
        };
    },
    componentDidMount: function() {
        this._schemes = parseAttachmentProp(this.props.attachment);
        this._anchor = this.props.anchor ? this.props.anchor() : this.refs.escape.escapePoint;
        this.withAnchorAncestors(e => e.addEventListener("scroll", this.elementDidScroll));
        window.addEventListener("resize", this.windowDidResize);
        this.reposition();
    },
    componentWillReceiveProps: function(nextProps) {
        if (this.props.attachment != nextProps.attachment) {
            this._schemes = parseAttachmentProp(nextProps.attachment);
        }
    },
    componentWillUnmount: function() {
        window.removeEventListener("resize", this.windowDidResize);
        this.withAnchorAncestors(e => e.removeEventListener("scroll", this.elementDidScroll));
    },
    withAnchorAncestors: function(cb) {
        if (this._anchor) {
            var e = this._anchor.parentNode;
            while (e != null && e != window) {
                cb(e);
                e = e.parentNode;
            }
        }
    },
    elementDidScroll: function() {
        this.reposition();
    },
    windowDidResize: function() {
        this.reposition();
    },
    reposition: function() {
        var prect = viewportRect(this._popup);
        var psize = prect.getSize();
        var arect = viewportRect(this._anchor);
        var viewport = viewportSize();

        var scheme = this.chooseScheme(arect, psize, viewport);
        var translation = scheme.calcTranslation(arect, prect, viewport);
        if (!translation || (translation.x === 0 && translation.y === 0))
            return;
        this.translate(translation);
    },
    chooseScheme: function(arect, psize, viewport) {
        // if there is a scheme, and it still fits, nothing to do
        if (this._scheme && this._scheme.fits(arect, psize, viewport))
            return this._scheme;

        // otherwise, find the first scheme that fits
        var scheme = this._schemes.find(s => s.fits(arect, psize, viewport)) || this._scheme || this._schemes[0];
        return this._scheme = scheme;
    },
    translate: function(translation) {
        this.setTranslation(((this.state.translation && this.state.translation.clone()) || new Vec2(0, 0)).add(translation));
    },
    setTranslation: function(translation) {
        this.setState({translation: translation});
    },
});

module.exports = FloatAffixed;
