import React from "react";

const Navbar = ({ userAddress }) => {
  return (
    <nav className="navbar navbar bg flex-md-nowrap">
      <form className="mx-2 my-auto w-50 d-inline">
            <div className="input-group input-group-sm">
                <div className="input-group-prepend">
                    <span className="input-group-text" id="inputGroup-sizing-sm">current Metamask address</span>
                </div>
                <input type="text" className="form-control" placeholder={userAddress} aria-describedby="inputGroup-sizing-sm"/>

            </div>

      </form>
      
      <span style={{float: "right"}} className="navbar-brand mb-0 h2">P2P Lending System</span>

    </nav>
  );
};

export default Navbar;