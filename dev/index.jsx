"use strict";
var React = require('react');

var FloatAffixed = require('../src/react-float-affixed');

var Inner = React.createClass({
    render: function() {
        return <div>Inner (color: {this.context.color})</div>
    },
    contextTypes: {
        color: React.PropTypes.string,
    },
});

var Outer = React.createClass({
    render: function() {
        return <div>
            Dev from react-escape
            <Inner />
            <div style={{overflow:'auto',border:'solid 1px blue',margin:'30px',height:600,width:600}}>
                <div style={{height:1000,width:1000,fontSize:60,position:'relative'}}>
                    Scroll Me
                    <div
                        type="checkbox"
                        style={{
                            position:'absolute',
                            top:300,
                            right:'40%',
                            fontSize: 15,
                            padding: 4,
                        }}>
                        <input type="checkbox" checked={this.state.on} onClick={()=>this.setState({on:!this.state.on})}/>
                        <label>This is my checkbox</label>
                        {this.state.on &&
                            <FloatAffixed attachment="under,over,right,left">
                                <span>This is my popout</span>
                            </FloatAffixed>
                        }
                    </div>

                    <div ref="anchorForPopout"
                        style={{
                            position:'absolute',
                            top:400,
                            height:50,
                            width:50,
                            right:'40%',
                            fontSize:15,
                            textAlign:'center',
                            border:'solid 1px red',
                            backgroundColor: 'white',
                        }}>
                        Anchor
                    </div>
                </div>
            </div>
            <FloatAffixed
                anchor={()=>this.refs.anchorForPopout}
                attachment="under,over,right,left"
                style={{
                    padding: 20,
                    boxShadow: '2px 2px 6px rgba(0, 0, 0, 0.5)',
                    backgroundColor: 'white',
                    border: 'solid 1px #e0e0e0',
                    pointerEvents: 'auto',
                    position: 'absolute',
                }}
            >
                <ul>
                    <li>This</li>
                    <li>Hit that</li>
                    <li>Ice cold</li>
                    <li>Michelle</li>
                    <li>Pfeiffer that</li>
                    <li>White gold</li>
                    <li>Don't believe me just watch, (C'mon)</li>
                </ul>
            </FloatAffixed>
        </div>
    },
    childContextTypes: {
        color: React.PropTypes.string,
    },
    getInitialState: function() {
        return {on:false};
    },
    getChildContext: function() {
        return {color: "purple"};
    },
});

module.exports = <Outer />
