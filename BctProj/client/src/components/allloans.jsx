import React, { Component } from "react";
import { Redirect } from 'react-router-dom';

class AllLoans extends Component {
    state = {formTitle: "All Loans", web3: null, toLoanDetails: false, contractAddress: null }
    
    componentDidMount() {
        
        if (this.props.contracts.lenght === undefined || this.props.contracts.lenght > 0) {
            this.props.onTitle('')    
        } else {
            this.props.onTitle(this.state.formTitle)
        }
        this.setState({web3: this.props.web3});
    }

    getCardClassFrameStyle(status) {
        if (status === 0) {
            return 'card border-primary mb-3';
        } else {
            return 'card border-dark mb-3';
        }
    }

    getCardClassBodyStyle(status) {
        if (status === 0) {
            return 'card-body text-primary';
        } else {
            return 'card-body text-dark';
        }
    }

    handleViewDetails(address) {
        this.setState({toLoanDetails: true, contractAddress: address});
    }

    showContracts() {
        console.log(this.props.contracts);
        if (this.state.toLoanDetails === true) {
            return <Redirect to={'/loandetails/' + this.state.contractAddress} />
        }
        return (
        <React.Fragment>
            <div className="row">
            {
                this.props.contracts.map(loan => (
                    <div className="col-sm-6"  key={loan.contractAddress}>
                        <div className={this.getCardClassFrameStyle(loan.status)}>
                            <h5 className="card-header">
                                {loan.title}
                            </h5>
                            <div className={this.getCardClassBodyStyle(loan.status)}>
                                <h6 className="card-title">Borrower: {loan.borrowerAddress}</h6>
                                <h4 className="card-text">Loan: {this.state.web3 ? this.state.web3.utils.fromWei(loan.amount, 'ether') : ''} ETH </h4>
                                <button className="btn btn-info" onClick={() => this.handleViewDetails(loan.contractAddress)}>View Details</button>
                            </div>
                            <div className="card-footer text-muted">
                                <footer className="blockquote-footer">{loan.contractAddress}</footer>
                            </div>
                        </div>
                    </div>
                ))
            }
            </div>
            {
                this.props.contracts.length === 0 ? (
                    <div>
                        <img src="/img/p2p.jpg" height="400" width="1000" className="rounded mx-auto d-block" alt="Applhy Loan"/>
                        <div>&nbsp;</div>
                        <p className="text-center display-4">
                            P2P Lending System
                                </p>
                    </div>  
                ) : (<div></div>)
            }
        </React.Fragment>
        
        );
    }

    render() {
        return this.showContracts()
    }
}

export default AllLoans;