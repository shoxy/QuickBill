// @flow
import React, { Component } from "react";
import { BrowserRouter as Router, Route} from "react-router-dom";

import NavBar from "./common/NavBar";
import HomePage from "./home/HomePage";
import Dashboard from "./dashboard/Dashboard";
import Preview from "./dashboard/Preview";

export default class App extends Component {
    constructor(props) {
        super(props);
        var channelId = parent.window.channelId;
        this.state = {
            channelId: channelId,
        };
    }

    componentDidMount() {
        var pathArray = document.referrer.split( '/' );
        var protocol = pathArray[0];
        var host = pathArray[2];
        var baseUrl = protocol + '//' + host;
        var url = baseUrl + '/trans-inv-form';
        fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                channelId: this.state.channelId,
            })
        }).then(response => response.json())
            .then(data => {
                // options[0].label = this.props.translations ? this.props.translations['Paid'];
                window.translations = data;
                this.setState({translations: data})
            });
    }
    render() {
        return (
            <Router>
                <div>
                    {this.state && this.state.translations && <Dashboard/>}
                </div>
            </Router>
        );
    }
}
