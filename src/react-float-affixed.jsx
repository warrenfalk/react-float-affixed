"use strict";
var React = require('react');
var Escape = require('react-escape');
var {Rect,Vec2} = require('pex-geom');
var classNames = require('classnames');

// get Rect of element in viewport coordinates
function viewportRect(element) {
    var rect = element.getBoundingClientRect();
    return new Rect(rect.left, rect.top, rect.width, rect.height);
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
function dclamp(delta, pmin, pmax, space) {
    var edgemax = pmax + delta;
    var edgemin = pmin + delta;
    // nudge back into viewport if any edges fall out of bounds
    if (edgemin < 0)
        return delta - edgemin;
    else if (edgemax > space)
        return delta + (space - edgemax);
    return delta;
}

function clamp(value, pmin, pmax) {
    return value < pmin ? pmin : (value > pmax ? pmax : value);
}

function center_y(rect) {
    return (rect.min.y + rect.max.y) * 0.5;
}

function center_x(rect) {
    return (rect.min.x + rect.max.x) * 0.5;
}

function translateRect(rect, translation) {
    if (!rect || !translation) return rect;
    return new Rect(rect.x + translation.x, rect.y + translation.y, rect.width, rect.height);
}

var edgeSchemes = {
    "over": new AttachScheme('over', {
        fits: (arect, psize, viewport) => psize.y <= Math.min(arect.min.y, viewport.y),
        calcTranslation: (arect, prect, gap, viewport) => new Vec2(
            dclamp(edgeAlignMaxSpace(arect.min.x, arect.max.x, prect.min.x, prect.max.x, viewport.x), prect.min.x, prect.max.x, viewport.x),
            dclamp(align(arect.min.y - gap, prect.max.y), prect.min.y, prect.max.y, viewport.y)
        ),
    }),
    "under": new AttachScheme('under', {
        fits: (arect, psize, viewport) => psize.y <= (viewport.y - arect.max.y),
        calcTranslation: (arect, prect, gap, viewport) => new Vec2(
            dclamp(edgeAlignMaxSpace(arect.min.x, arect.max.x, prect.min.x, prect.max.x, viewport.x), prect.min.x, prect.max.x, viewport.x),
            dclamp(align(arect.max.y + gap, prect.min.y), prect.min.y, prect.max.y, viewport.y)
        ),
    }),
    "left": new AttachScheme('left', {
        fits: (arect, psize, viewport) => psize.x <= Math.min(arect.min.x, viewport.x),
        calcTranslation: (arect, prect, gap, viewport) => new Vec2(
            dclamp(align(arect.min.x - gap, prect.max.x), prect.min.x, prect.max.x, viewport.x),
            dclamp(edgeAlignMaxSpace(arect.min.y, arect.max.y, prect.min.y, prect.max.y, viewport.y), prect.min.y, prect.max.y, viewport.y)
        ),
    }),
    "right": new AttachScheme('right', {
        fits: (arect, psize, viewport) => psize.x <= (viewport.x - arect.max.x),
        calcTranslation: (arect, prect, gap, viewport) => new Vec2(
            dclamp(align(arect.max.x + gap, prect.min.x), prect.min.x, prect.max.x, viewport.x),
            dclamp(edgeAlignMaxSpace(arect.min.y, arect.max.y, prect.min.y, prect.max.y, viewport.y), prect.min.y, prect.max.y, viewport.y)
        ),
    }),
}

var centerSchemes = {
    "over": new AttachScheme('over', {
        fits: (arect, psize, viewport) => psize.y <= Math.min(arect.min.y, viewport.y),
        calcTranslation: (arect, prect, gap, viewport) => new Vec2(
            dclamp(align(center_x(arect), center_x(prect)), prect.min.x, prect.max.x, viewport.x),
            dclamp(align(arect.min.y - gap, prect.max.y), prect.min.y, prect.max.y, viewport.y)
        ),
    }),
    "under": new AttachScheme('under', {
        fits: (arect, psize, viewport) => psize.y <= (viewport.y - arect.max.y),
        calcTranslation: (arect, prect, gap, viewport) => new Vec2(
            dclamp(align(center_x(arect), center_x(prect)), prect.min.x, prect.max.x, viewport.x),
            dclamp(align(arect.max.y + gap, prect.min.y), prect.min.y, prect.max.y, viewport.y)
        ),
    }),
    "left": new AttachScheme('left', {
        fits: (arect, psize, viewport) => psize.x <= Math.min(arect.min.x, viewport.x),
        calcTranslation: (arect, prect, gap, viewport) => new Vec2(
            dclamp(align(arect.min.x - gap, prect.max.x), prect.min.x, prect.max.x, viewport.x),
            dclamp(align(center_y(arect), center_y(prect)), prect.min.y, prect.max.y, viewport.y)
        ),
    }),
    "right": new AttachScheme('right', {
        fits: (arect, psize, viewport) => psize.x <= (viewport.x - arect.max.x),
        calcTranslation: (arect, prect, gap, viewport) => new Vec2(
            dclamp(align(arect.max.x + gap, prect.min.x), prect.min.x, prect.max.x, viewport.x),
            dclamp(align(center_y(arect), center_y(prect)), prect.min.y, prect.max.y, viewport.y)
        ),
    }),
}

var edgeFactors = {
    "over": { v: -1, h: 0, par: rect => ({ min: rect.y, max: rect.y + rect.height }), perp: rect => ({ min: rect.x, max: rect.x + rect.width }) },
    "under": { v: 1, h: 0, par: rect => ({ min: rect.y, max: rect.y + rect.height }), perp: rect => ({ min: rect.x, max: rect.x + rect.width }) },
    "left": { v: 0, h: -1, perp: rect => ({ min: rect.y, max: rect.y + rect.height }), par: rect => ({ min: rect.x, max: rect.x + rect.width }) },
    "right": { v: 0, h: 1, perp: rect => ({ min: rect.y, max: rect.y + rect.height }), par: rect => ({ min: rect.x, max: rect.x + rect.width }) },
    "unknown": { v: 0, h: 0, perp: () => ({ min: 0, max: 0 }), par: () => ({ min: 0, max: 0 }) },
}

function getSchemes(align) {
    return align == 'center' ? centerSchemes : edgeSchemes;
}

// parses the text of an "attachment" prop into an array of scheme objects
function parseEdgeAlignProps(edges, align) {
    const schemes = getSchemes(align);
    if (!edges)
        return [schemes.under, schemes.over, schemes.right, schemes.left];
    return edges
        .split(',')
        .map(name => schemes[name.trim()])
        .filter(s => s)
}

var styles = {
    required: {
        position: 'absolute',
    },
    default: {
        pointerEvents: 'auto',
    },
    prefab_float: {
        boxShadow: '2px 2px 6px rgba(0, 0, 0, 0.5)',
        backgroundColor: 'white',
    },
    prefab_callout: {
        boxShadow: '2px 2px 6px rgba(0, 0, 0, 0.5)',
        backgroundColor: 'white',
        borderRadius: 5,
    },
}

function inflate(r, d) {
    return {min: {x: r.min.x - d, y: r.min.y - d}, max: {x: r.max.x + d, y: r.max.y + d}}
}

const bridgeSize = 20;
// precalculate the breadth (size at base) and elevation (distance to peak from base)
const bridgeBreadth = bridgeSize * 2;
const bridgeElev = bridgeSize;


const bridgeProps = {
    over: (anchorRect, popupRect, translation) => ({
        height: bridgeSize,
        width: bridgeSize * 2,
        bottom: -bridgeSize,
        left: clamp(anchorRect.min.x - translation.x + (anchorRect.width * 0.5) - bridgeElev, 0, popupRect.width - bridgeBreadth),
        transform: `translate(${bridgeBreadth * 0.5},${bridgeElev * 0.5}),rotate(0,0,0)`,
    }),
    under: (anchorRect, popupRect, translation) => ({
        height: bridgeSize,
        width: bridgeSize * 2,
        top: -bridgeSize,
        left: clamp(anchorRect.min.x - translation.x + (anchorRect.width * 0.5) - bridgeElev, 0, popupRect.width - bridgeBreadth),
        transform: `translate(${bridgeBreadth * 0.5},${bridgeElev * 0.5}),rotate(180,0,0)`,
    }),
    left: (anchorRect, popupRect, translation) => ({
        height: bridgeSize * 2,
        width: bridgeSize,
        right: -bridgeSize,
        top: clamp(anchorRect.min.y - translation.y + (anchorRect.height * 0.5) - bridgeElev, 0, popupRect.height - bridgeBreadth),
        transform: `translate(${bridgeElev * 0.5},${bridgeBreadth * 0.5}),rotate(-90,0,0)`,
    }),
    right: (anchorRect, popupRect, translation) => ({
        height: bridgeSize * 2,
        width: bridgeSize,
        left: -bridgeSize,
        top: clamp(anchorRect.min.y - translation.y + (anchorRect.height * 0.5) - bridgeElev, 0, popupRect.height - bridgeBreadth),
        transform: `translate(${bridgeElev * 0.5},${bridgeBreadth * 0.5}),rotate(90,0,0)`,
    }),
}

function makeBridge(state, props) {
    // do not calculate unless we have a position for the anchor and popup
    if (!state.anchorRect)
        return null;
    // get the relevant values from the state
    const { schemeName, anchorRect, popupRect, translation } = state;
    // calculate bridge location
    let { transform, ...bridgeStyle } = bridgeProps[schemeName](anchorRect, popupRect, translation);

    let trianglePath = "M -20.5,-11 0,9.5 20.5,-11 Z";

    let trianglePathOutline = "M -19.5,-10 -20,-10 0,10 20,-10 19.5,-10 0,9.5 Z"
    //let trianglePathOutline = "M -20,-10 0,10 20,-10 0,9.5 Z"

    return (
        <div
            className="bridge"
            style={{
                position: 'absolute',
                overflow: 'visible',
                ...bridgeStyle,
            }}>
            <svg
                style={{width: bridgeStyle.width, height: bridgeStyle.height, overflow:'visible'}}>
                <g transform={transform}>
                    <path
                        style={{fill:'white'}}
                        d={trianglePath} />
                    <path
                        style={{fill:'#808080'}}
                        d={trianglePathOutline} />
                </g>
            </svg>
        </div>
    )
}

var FloatAffixed = React.createClass({
    render: function() {
        var { render, children, className, style, ...props } = this.props;
        var theme = props.prefab && styles['prefab_' + this.props.prefab];
        var popupStyle = {
            ...styles.default,
            ...theme,
            ...style,
            ...styles.required,
            transform: 'translate('+this.state.translation.x+'px,'+this.state.translation.y+'px)',
        };
        var edgeFactor = edgeFactors[this.state.schemeName || "unknown"];
        var translation = this.state.translation;
        var edges = {
            anchor: edgeFactor.perp(this.state.anchorRect),
            popup: edgeFactor.perp(translateRect(this.state.popupRect, translation)),
        };

        if (render) {
            children = render(this.state.schemeName, { edges: edges });
        }
        return (
            <Escape ref="escape" to="viewport" style={{overflow:'hidden'}}>
                <div
                    ref={(r)=>{this._popup = r}}
                    style={popupStyle}
                    {...props}
                    className={classNames("float-affixed", this.state.schemeName, className)}>
                    {this.props.bridge
                        ? makeBridge(this.state, this.props)
                        : null
                    }
                    {children}
                </div>
            </Escape>
        );
    },
    propTypes: {
        prefab: React.PropTypes.string,
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
        this._schemes = parseEdgeAlignProps(this.props.edges, this.props.align);
        this._anchor = this.props.anchor ? this.props.anchor() : this.refs.escape.escapePoint;
        if (!this._anchor)
            /* eslint no-console: 0 */
            console.error("no anchor supplied for float-affixed");
        this.withAnchorAncestors(e => e.addEventListener("scroll", this.elementDidScroll));
        window.addEventListener("resize", this.windowDidResize);
        this.reposition(this.props);
    },
    componentWillReceiveProps: function(nextProps) {
        if (this.props.edges != nextProps.edges || this.props.align != nextProps.align) {
            this._schemes = parseEdgeAlignProps(nextProps.edges, nextProps.align);
        }
        if (nextProps != this.props) {
            this.reposition(nextProps);
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
        this.reposition(this.props);
    },
    windowDidResize: function() {
        this.reposition(this.props);
    },
    reposition: function(props) {
        var prect = viewportRect(this._popup);
        var psize = prect.getSize();
        var arect = viewportRect(this._anchor);
        var gap = (props.gap || 0) + (props.bridge ? bridgeSize : 0);
        var viewport = this.viewportSize();

        var scheme = this.chooseScheme(inflate(arect, gap), psize, viewport);
        var delta = scheme.calcTranslation(arect, prect, gap, viewport);
        /*
        if (!delta || (delta.x === 0 && delta.y === 0))
            return;
        */
        var nextTranslation = this.state.translation.clone().add(delta);
        this.setState({
            translation: nextTranslation,
            schemeName: scheme.name,
            anchorRect: arect,
            popupRect: prect,
        });
    },
    chooseScheme: function(arect, psize, viewport) {
        // if there is a scheme, and it still fits, nothing to do
        if (this._scheme && this._scheme.fits(arect, psize, viewport) && (this._schemes.indexOf(this._scheme) != -1))
            return this._scheme;

        // otherwise, find the first scheme that fits
        var scheme = this._schemes.find(s => s.fits(arect, psize, viewport)) || this._scheme || this._schemes[0];
        return this._scheme = scheme;
    },
    viewportSize: function() {
        var { width, height } = this.refs.escape.getSize();
        return new Vec2(width, height);
    },
});

module.exports = FloatAffixed;
