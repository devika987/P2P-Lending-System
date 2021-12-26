import React, { Component } from "react";
import { Redirect } from 'react-router-dom';
import SimpleLoanContract from "../contracts/SimpleLoan.json"; 

class LoanDetails extends Component {
    state = {formTitle: "Contract - ", loan: { owner: null, borrower: null, loanAmount: null, status: null, lenderCount: 0,  dueDate: null}, lenders: []};

    getStatusDescription(idx) {
        switch(idx) {
            case "0": return 'Requesting';
            case "1": return 'Funding';
            case "2": return 'Funded';
            case "3": return 'FundWithdrawn';
            case "4": return 'Repaid';
            case "5": return 'Defaulted';
            case "6": return 'Refunded';
            case "7": return 'Cancelled';
            case "8": return 'Closed';
            default: return 'None';
        }
    }
    
    componentDidMount() {
        this.setState({web3: this.props.web3});
        this.props.onTitle(this.state.formTitle + this.props.match.params.id);
        try {
            const c = new this.props.web3.eth.Contract(SimpleLoanContract.abi, this.props.match.params.id);
           
            //clock.restore()
           
            c.methods.info().call().then(info => {
                console.log(info.p_dueDate);
               let d = new Date(info.p_dueDate*1000);
               
                console.log(d.toDateString());
                console.log(this.getStatusDescription(info.p_status));
                console.log(info.p_now);
                console.log(info.p_dueDate);
                if(this.getStatusDescription(info.p_status)==='FundWithdrawn'&&info.p_now >= info.p_dueDate){
                  
                        this.handleDefault();
                }
                return {
                        owner: info.p_owner,
                        borrower: info.p_borrower,
                        loanAmount: this.props.web3.utils.fromWei(info.p_loanAmount, 'ether'),
                        status: this.getStatusDescription(info.p_status),
                        lenderCount: parseInt(info.p_lenderCount),
                        dueDate:d.toDateString()
                                         };
            }).then(l => {
                this.setState({loan: l});
                this.refreshLenders();
               
            });
        } catch(error) {
            console.error(error);
        }
    }

    async refreshLenders() {
        try {
            const contract = new this.props.web3.eth.Contract(SimpleLoanContract.abi, this.props.match.params.id);
            let count = await contract.methods.lenderCount().call();
            let ls = [];
            for(let i = 0; i < count; i++) {
                let l = await contract.methods.lenderAt(i).call();
                l.p_lendingAmount = this.props.web3.utils.fromWei(l.p_lendingAmount, 'ether');
                l.p_repaidAmount = this.props.web3.utils.fromWei(l.p_repaidAmount, 'ether');
                l.p_refundedAmount = this.props.web3.utils.fromWei(l.p_refundedAmount, 'ether');
                l.p_interestRate = this.props.web3.utils.fromWei(l.p_interestRate, 'ether');
                ls.push(l);
                console.log(l);
            }    
            this.setState({lenders: ls});
        } catch(err) {
            console.log(err);
        }
    }
  async handleDefault(){
        const { web3 } = this.state;
        let borrowerAddr = await this.state.web3.eth.coinbase;
        try {
            const loan = new this.props.web3.eth.Contract(SimpleLoanContract.abi, this.props.match.params.id);
            
            await loan.methods.toDefault().call({from: borrowerAddr});
            let tx = await loan.methods.toDefault().send({from: borrowerAddr});
            let l = {...this.state.loan};
            console.log(tx);
            l.lenderCount = parseInt(await loan.methods.lenderCount().call({from:borrowerAddr}));
            l.status = this.getStatusDescription(await loan.methods.status().call());
            this.setState({loan: l, hasError: false});
        } catch(err) {
            console.log(err);
            this.setState({hasError: true, errorMessage: err.message});
        }
    }

    handleCancel = async(e) => {
        e.preventDefault();
        let borrowerAddr = await this.state.web3.eth.coinbase;
        try {
            const loan = new this.props.web3.eth.Contract(SimpleLoanContract.abi, this.props.match.params.id);
            
            await loan.methods.cancel().call({from: borrowerAddr});
            let tx = await loan.methods.cancel().send({from: borrowerAddr});
            let l = {...this.state.loan};
            console.log(tx);
            l.lenderCount = parseInt(await loan.methods.lenderCount().call({from:borrowerAddr}));
            l.status = this.getStatusDescription(await loan.methods.status().call());
            this.setState({loan: l, hasError: false});
        } catch(err) {
            console.log(err);
            this.setState({hasError: true, errorMessage: err.message});
        }
    }
    async handleRefundAfterDefaulted() {
    const { web3 } = this.state;
    let ownerAddr = await this.state.web3.eth.coinbase;
    try {
        const loan = new this.props.web3.eth.Contract(SimpleLoanContract.abi, this.props.match.params.id);
        await loan.methods.refundAfterDefaulted().call({from: ownerAddr});
        let tx = await loan.methods.refundAfterDefaulted().send({from: ownerAddr});
        console.log(tx);
        let l = {...this.state.loan};
        l.lenderCount = parseInt(await loan.methods.lenderCount().call({from: ownerAddr}));
        l.status = this.getStatusDescription(await loan.methods.status().call());
        this.setState({loan: l});
    } catch(err) {
        console.log(err);
        this.setState({hasError: true, errorMessage: err.message});
    }
}
    handleFundIt = async(e) => {
        e.preventDefault();
        const { web3 } = this.state;
        let loanAmount = web3.utils.toWei(e.target.fundAmount.value, 'ether');
        let IRate = web3.utils.toWei(e.target.interestRate.value, 'ether');
        let lenderAddr = await this.state.web3.eth.coinbase;
        
        try {
            const loan = new this.props.web3.eth.Contract(SimpleLoanContract.abi, this.props.match.params.id);
            await loan.methods.depositFund(IRate).call({from: lenderAddr, value: loanAmount});
            let tx = await loan.methods.depositFund(IRate).send({from: lenderAddr, value: loanAmount});
            console.log(tx);
            let l = {...this.state.loan};
            l.lenderCount += 1;
            l.status = this.getStatusDescription(await loan.methods.status().call());

            
            this.setState({loan: l});
        } catch(err) {
            console.log(err);
            this.setState({hasError: true, errorMessage: err.message});
        }
    }

    handleRefund = async(e) => {
        e.preventDefault();
        const { web3 } = this.state;
        let ownerAddr = await this.state.web3.eth.coinbase;
        try {
            const loan = new this.props.web3.eth.Contract(SimpleLoanContract.abi, this.props.match.params.id);
            await loan.methods.refund().call({from: ownerAddr});
            let tx = await loan.methods.refund().send({from: ownerAddr});
            console.log(tx);
            let l = {...this.state.loan};
            l.lenderCount = parseInt(await loan.methods.lenderCount().call({from: ownerAddr}));
            l.status = this.getStatusDescription(await loan.methods.status().call());
            this.setState({loan: l});
        } catch(err) {
            console.log(err);
            this.setState({hasError: true, errorMessage: err.message});
        }
    }

    handleRepay = async(e) => {
        e.preventDefault();
        const { web3 } = this.state;
        let borrowerAddr = await this.state.web3.eth.coinbase;
        try {
            const loan = new this.props.web3.eth.Contract(SimpleLoanContract.abi, this.props.match.params.id);
            const ownedAmount = await loan.methods.ownedAmount().call();
            await loan.methods.repay().call({from: borrowerAddr, value: ownedAmount});
            let tx = await loan.methods.repay().send({from: borrowerAddr, value: ownedAmount});
            console.log(tx);
            let l = {...this.state.loan};
            l.status = this.getStatusDescription(await loan.methods.status().call());
            
            this.setState({loan: l, hasError: false});
        } catch(err) {
            console.log(err);
            this.setState({hasError: true, errorMessage: err.message});
        }
    }

   

    handleBorrowerWithdraw = async() => {
        const { web3 } = this.state;
        let borrowerAddr = await this.state.web3.eth.coinbase;
        try {
            const loan = new web3.eth.Contract(SimpleLoanContract.abi, this.props.match.params.id);
            await loan.methods.withdrawToBorrower().call({from: borrowerAddr});
            let tx = await loan.methods.withdrawToBorrower().send({from: borrowerAddr});
            console.log(tx);

           // this.state.loan.dueDate = await loan.methods.dueDate().call();
            console.log("account default after"+Date(this.state.loan.dueDate));
            let l = {...this.state.loan};
            l.status = this.getStatusDescription(await loan.methods.status().call());

           
            this.setState({loan: l, hasError: false});
        } catch(err) {
            console.log(err);
            this.setState({hasError: true, errorMessage: err.message});
        }
    }

    handleWithdrawToLenders = async() => {
        const { web3 } = this.state;
        let borrowerAddr = await this.state.web3.eth.coinbase;
        try {
            const loan = new web3.eth.Contract(SimpleLoanContract.abi, this.props.match.params.id);
            await loan.methods.withdrawToLenders().call({from: borrowerAddr});
            let tx = await loan.methods.withdrawToLenders().send({from: borrowerAddr});
            console.log(tx);
            let l = {...this.state.loan};
            l.status = this.getStatusDescription(await loan.methods.status().call());
          
            this.setState({loan: l, hasError: false});
        } catch(err) {
            console.log(err);
            this.setState({hasError: true, errorMessage: err.message});
        }
    }

    renderStatus() {
        let style = "badge badge-light";
        if (this.state.loan.status === 'Funded') {
            style = 'badge badge-primary';
        } else if (this.state.loan.status === 'Refunded') {
            style = "badge badge-info";
        } else if (this.state.loan.status === 'Defaulted') {
            style = "badge badge-danger";
        } else if (this.state.loan.status === 'Cancelled') {
            style = "badge badge-dark";
        } else if (this.state.loan.status === 'Closed') {
            style = "badge badge-secondary";
        } else if (this.state.loan.status === 'FundWithdrawn') {
            style = "badge badge-warning";
        } else if (this.state.loan.status === 'Repaid') {
            style = "badge badge-success";
        } 
        return (<h5><span className={style}>Status: {this.state.loan.status}</span></h5>
            );
    }

    render() {
        return (
            <div>
                { this.state.hasError ? (
                    <div className="alert alert-danger" role="alert">
                        {this.state.errorMessage}
                    </div>
                  ) : (<div></div>)
                }
            <div className="row">
                <div className="col">
               {/* <h6 htmlFor="borrowerAddr">Owner: {this.state.loan.owner}</h6>*/}
                <h6 htmlFor="borrowerAddr">Borrower: {this.state.loan.borrower}</h6>
                <h5>Loan Amount: {this.state.loan.loanAmount} ETH</h5>
                {this.renderStatus()}
                { this.state.loan.status === 'FundWithdrawn' ? (    
                        <React.Fragment>
                        <h5 > <span className={"badge badge-danger"}>Account will get defaulted after {this.state.loan.dueDate}</span></h5>
                        </React.Fragment>
                    )  : (<div></div>)
                }
                </div>
            </div>
            <div className="row">
                <div className="col">
                <hr/>
                <h4>Lender Information</h4>
                {/* Lender count: {this.state.loan.lenderCount} */}

                <LenderTable lenders={this.state.lenders}/>

                { this.state.loan.status === 'Funding' ? (
                    <form className="form-inline" onSubmit={this.handleFundIt}>
                        <div className="form-group mb-2">
                            <input type="text" readOnly className="form-control-plaintext" id="staticEmail2" value="Funding Amount"/>
                        </div>
                        <div className="form-group mx-sm-3 mb-2">
                            <input type="text" className="form-control" id="fundAmount" placeholder="Amount In Ether"/>
                            <input type="text" className="form-control" id="interestRate" placeholder="Proposed Interest Rate"/>
                        </div>
                        <button type="submit" className="btn btn-primary mr-2">Fund It !!!</button>
                    </form>
                  ) : (<div></div>)
                }
                <hr/>
                <div>
                { (this.state.loan.status === 'Funding' || this.state.loan.status === 'Funded') && this.state.loan.lenderCount > 0 ? (    
                        <button onClick={this.handleRefund} className="btn btn-success mr-2">Refund to Lenders</button>
                    )  : (<div></div>)
                }
                { (this.state.loan.status === 'Funding'||  this.state.loan.status === 'Funded' ||this.state.loan.status === 'Refunded') ? (    
                        <button onClick={this.handleCancel} className="btn btn-success mr-2">Cancel</button>
                    )  : (<div></div>)
                }
                { this.state.loan.status === 'Funded' ? (    
                        <button onClick={this.handleBorrowerWithdraw} className="btn btn-success mr-2">Widthdraw To Borrower Account</button>
                    )  : (<div></div>)
                }
                { this.state.loan.status === 'FundWithdrawn' ? (    
                        <React.Fragment>
                        <button onClick={this.handleRepay} className="btn btn-success mr-2">Repay Account</button>
                        {/*<button onClick={this.handleDefault} className="btn btn-danger mr-2">Default Account</button>*/}
                        </React.Fragment>
                    )  : (<div></div>)
                }
                 { this.state.loan.status === 'Repaid' ? (    
                        <button onClick={this.handleWithdrawToLenders} className="btn btn-success mr-2">Repay Lender In Full</button>
                    )  : (<div></div>)
                }
                </div>
                </div>
            </div>
            </div>
        );
    }
}

class LenderTable extends Component {
    render() {
        return (
            <React.Fragment>
                <table className="table table-bordered">
                    <thead>
                        <tr>
                        <th scope="col">#</th>
                        <th scope="col">Lender Address</th>
                        <th scope="col">Lending Amount</th>
                        <th scope="col">Repaid Amount</th>
                        <th scope="col">Refunded Amount</th>
                        <th scope="col">Proposed Interest rate</th>

                        </tr>
                    </thead>
                    <tbody>
                {
                    this.props.lenders.map((l,index) => (
                            <tr>
                            <th scope="row">{++index}</th>
                            <td>{l.p_lender}</td>
                            <td className="text-center">{l.p_lendingAmount} <small>ETH</small></td>
                            <td className="text-center">{l.p_repaidAmount} <small>ETH</small></td>
                            <td className="text-center">{l.p_refundedAmount} <small>ETH</small></td>
                            <td className="text-center">{l.p_interestRate} <small>ETH</small></td>

                            </tr>
                    ))
                }
                    </tbody>
                </table>
            </React.Fragment>
        );
    }
}

export default LoanDetails;