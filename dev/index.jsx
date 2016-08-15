"use strict";
var React = require('react');
require('es5-shim/es5-shim.js');
require('es6-shim');

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
            <input type="text" placeholder="edges" value={this.state.edges} onChange={e=>this.setState({edges: e.target.value})} />
            <input type="text" placeholder="align" value={this.state.align} onChange={e=>this.setState({align: e.target.value})} />
            <input type="text" placeholder="bridge" value={this.state.bridge} onChange={e=>this.setState({bridge: e.target.value})} />
            <input type="text" placeholder="gap" value={this.state.gap} onChange={e=>this.setState({gap: e.target.value})} />
            <Inner />
            <div style={{overflow:'auto',border:'solid 1px blue',margin:'30px',height:600,width:600}}>
                <div style={{height:2000,width:2000,fontSize:60,position:'relative'}}>
                    Scroll Me
                    <div
                        type="checkbox"
                        style={{
                            position:'absolute',
                            top:300,
                            right:'40%',
                            fontSize: 15,
                            padding: 4,
                            border: 'solid 1px red',
                        }}>
                        <input type="checkbox" checked={this.state.on} onClick={()=>this.setState({on:!this.state.on})}/>
                        <label>This is my checkbox</label>
                        {this.state.on &&
                            <FloatAffixed
                                style={{
                                    padding: 20,
                                    boxShadow: '2px 2px 6px rgba(0, 0, 0, 0.5)',
                                    backgroundColor: 'white',
                                    border: 'solid 1px #e0e0e0',
                                    pointerEvents: 'auto',
                                    position: 'absolute',
                                    borderRadius: 5,
                                }}
                                edges={this.state.edges}
                                align={this.state.align}
                                bridge={this.state.bridge}
                                gap={this.state.gap|0}
                                >
                                <span>This is my popout. Popouts are for winners</span>
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
        {/*
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
                }}>
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
        */}
        </div>
    },
    childContextTypes: {
        color: React.PropTypes.string,
    },
    getInitialState: function() {
        return {
            on:false,
            edges: "over,under,left,right",
            align: "edge",
            bridge: "arrow",
            gap: 0,
        };
    },
    getChildContext: function() {
        return {color: "purple"};
    },
});

module.exports = <Outer />
