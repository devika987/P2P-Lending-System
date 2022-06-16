import React, { Component } from "react";
import { Redirect } from 'react-router-dom';
import SimpleLoanContract from "../contracts/SimpleLoan.json"; 

class NewLoanForm extends Component {
    state = {formTitle: "New Loan Request", web3: null, toHome: false }
    componentDidMount() {
        this.props.onTitle(this.state.formTitle)
        this.setState({web3: this.props.web3});
    }
    

    handleCreateRequest = async(e) => {
        e.preventDefault();
        
        let borrower = e.target.borrowerAddr.value;
        let loanAmount = e.target.loanAmt.value != '' ? this.state.web3.utils.toWei(e.target.loanAmt.value, 'ether') : "0";
        const { web3 } = this.state;
        if (!web3.utils.isAddress(borrower)) {
            this.setState({hasError: true, errorMessage: 'Borrower address is not a valid address in the network'});
            return;
        }

        let loanTitle = e.target.loanTitle.value;
        let owner = this.state.web3.eth.coinbase;
        let SimpleLoan = new this.state.web3.eth.Contract(SimpleLoanContract.abi);
        SimpleLoan.deploy({
            data: SimpleLoanContract.bytecode
        }).send({
            from: this.state.web3.eth.coinbase
        })
        .on('error', (error) => { 
            console.log(error);
            this.setState({hasError: true, errorMessage: error.message});
        })
        .then((newInstance) => {
            let newContract = {
                contractAddress: newInstance.options.address,
                borrowerAddress: borrower,
                amount: loanAmount,
                title: loanTitle            
            }
            
            const STORAGE_KEY = 'contracts';
            if (localStorage.hasOwnProperty(STORAGE_KEY)) {
                let value = localStorage.getItem(STORAGE_KEY);
                let contracts = JSON.parse(value);
                contracts.push(newContract);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
            } else {
                let contracts = [newContract];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
            }
            
            // Should have add a constructor to accept borrower and loan amount to avoid 2 transaction.
            // The original idea is to borrower create a contract to request, broker review and then set up
            // the request and send it. For this demo, the admin / broker do both together.
            newInstance.methods.request(borrower, loanAmount).send({from: owner}).then(r => {
                console.log(r);
                this.props.onNewLoan(newContract);
                this.setState({toHome: true});
            });
        });
    }

    render() {
        if (this.state.toHome === true) {
            return <Redirect to='/'/>
        }
        return (
            <form onSubmit={this.handleCreateRequest}>
                  <button type="button" className="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                  </button>
                { this.state.hasError ? (
                    <div class="alert alert-danger" role="alert">
                        {this.state.errorMessage}
                    </div>
                  ) : (<div></div>)
                }
                <div className="form-group">
                    <label>
                        Title: 
                    </label>
                    <input type="text" className="form-control" id="loanTitle"  placeholder="Loan Title" />
                </div>
                <div className="form-group">
                    <label>
                        Borrower Address: 
                    </label>
                    <input type="text" className="form-control" id="borrowerAddr" aria-describedby="borrowerAddress" placeholder="Enter borrower address" />
                    <small id="borrowerAddress" className="form-text text-muted">Ethereum Address</small>
                </div>
                <div className="form-group">
                    <label>Loan Amount:</label>
                    <input type="text" className="form-control" id="loanAmt" placeholder="Loan Amount In Ether"/>
                </div>
               
               
                <button type='submit' className="btn btn-primary mr-2">Create Request</button>
            </form>
        );
    }
}

export default NewLoanForm;
