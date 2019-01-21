// @flow
import React, { Component } from "react";
import SideNav from "./SideNav";
import Invoice from "./Invoice";
import { connect } from "react-redux";

import {
    setDownloadStatus
} from "../../actions";

type Props = {
    setDownloadStatus: Function,
    downloadStatus: ?boolean
};

class Dashboard extends Component {

    constructor(props: Props) {
        super(props);
    }

    componentDidMount() {
        const app = document.querySelector("#app");
        if (app) {
            app.className = "fix-navbar";
        }
    }

    componentWillUnmount() {
        const app = document.querySelector("#app");
        if (app) {
            app.className = ""; 
        }     
    }

    submitInvoice() {
        var parsedDate = new Date($('#date').val());
        var DateString = parsedDate.getFullYear() + '-' + (parsedDate.getMonth() + 1) + '-' + parsedDate.getDate() + 'TT00:00:00';
        parsedDate = new Date($('#due_date').val());
        var DueDateString = parsedDate.getFullYear() + '-' + (parsedDate.getMonth() + 1) + '-' + parsedDate.getDate() + 'TT00:00:00';
        var ExpectedPaymentDate = DueDateString;
        var InvoiceNumber = $('input[name="invoiceNumber"]').val();
        var CurrencyCode = $('input[name="currency"]').val() === '$' ? 'USD' : 'EUR';
        var Status = $('input[name="status"]').val();
        var LineAmountTypes = 'Inclusive';
        var SubTotal = parseFloat($('#subtotal').text());
        var TotalTax = 0;
        var TotalVAT = 0;
        var DiscountRate = 0;
        var Total = parseFloat($('#total').text());
        var LineItems = [];
        var ContactID = $('input[name="to"]').val();
        var Email = $('input[name="emailTo"]').val();

        $('.item-row').each(function (index, item) {
            LineItems[index] = {
                ItemCode: $(item).find('input[name="name"]').val(),
                Description: $(item).find('input[name="description"]').val(),
                Quantity: parseInt($(item).find('input[name="quantity"]').val()),
                UnitAmount: parseFloat($(item).find('input[name="price"]').val()),
            };
        });
        var json = {
            Type: "ACCREC",
            Contact: {
                ContactID: ContactID,
                Email: Email
            },
            DateString: DateString,
            DueDateString: DueDateString,
            ExpectedPaymentDate: ExpectedPaymentDate,
            InvoiceNumber: InvoiceNumber,
            CurrencyCode: CurrencyCode,
            Status: Status,
            LineAmountTypes: LineAmountTypes,
            SubTotal: SubTotal,
            TotalTax: TotalTax,
            TotalVAT: TotalVAT,
            DiscountRate: DiscountRate,
            Total: Total,
            LineItems: LineItems
        };

        parent.submitInvoice(json);
    }

    render() {
        return (
            <div className="dashboard" style={{'margin-top': 0}}>
                <SideNav />
                <Invoice />
                <div className="dashboard__element">
                    <div className="solid-btn solid-btn--ghost solid-btn--dashboard">
                        <button onClick={() => {window.print();}} className="ghost-btn"><i className="fa fa-eye" aria-hidden="true"> </i> Print</button>
                        <button
                            className="ghost-btn"
                            onClick={() => {this.submitInvoice()}}
                        >
                            <i className="fa fa-arrow-circle-down" aria-hidden="true"> </i> Submit
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state, ownProps) {
    return {
        downloadStatus: state.downloadStatus
    }
}

function mapDispatchToProps(dispatch) {
    return {
        setDownloadStatus: (downloadStatus) => dispatch(setDownloadStatus(downloadStatus))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
