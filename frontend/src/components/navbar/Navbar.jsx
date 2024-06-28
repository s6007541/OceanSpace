import React from "react";
import {
    Nav,
    NavLink,
    // Bars,
    NavMenu,
    NavBtn,
    NavBtnLink,
} from "./NavbarElements";
import "./navbar.css";


const Navbar = () => {
    return (
        <Nav>
            {/* <Bars /> */}
            <NavBtn>
                <NavLink to="/">หน้าหลัก</NavLink>
            </NavBtn>
            <NavBtn>
                <NavLink to="/Chat" >แชท</NavLink>
            </NavBtn>
            <NavBtn>
                <NavLink to="/Monitor">มอนิเตอร์</NavLink>
            </NavBtn>
            
        </Nav>
    );
};

export default Navbar;