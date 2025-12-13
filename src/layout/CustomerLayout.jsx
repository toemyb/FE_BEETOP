import React from "react";
import Header from "../customer/Header/Header";
import Footer from "../customer/footer/Footer";


const CustomerLayout = ({ children }) => {
    return (
        <div className="customer-layout">
            <Header />
            <main
                style={{
                    minHeight: "80vh",
                    backgroundColor: "#fafafa",
                    paddingBottom: "40px",
                }}
            >
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default CustomerLayout;
