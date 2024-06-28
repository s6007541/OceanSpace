import { NavLink as Link} from "react-router-dom";
import styled from "styled-components";

export const Nav = styled.nav`
    background-color: #F4FCFF;
    height: 60px;
    display: flex;
    align-items : center;
    padding : 0px 0px 16px 0px;
    border-bottom : 1px solid rgba(0, 0, 0, 0.20);

`;

export const NavLink = styled(Link)`
    
    color: rgba(0, 0, 0, 0.30);
    display: flex;
    align-items: center;
    text-decoration: none;
    text-align: center;
    cursor: pointer;
    &.active {
        color: #000;
    }

    color: rgba(0, 0, 0, 0.30);
    font-family: "Mitr";
    font-size: 18px;
    font-style: normal;
    font-weight: 700;
    line-height: 22px; /* 122.222% */

`;

// export const Bars = styled(FaBars)`
//     display: none;
//     color: #808080;
//     @media screen and (max-width: 768px) {
//         display: block;
//         position: absolute;
//         top: 0;
//         right: 0;
//         transform: translate(-100%, 75%);
//         font-size: 1.8rem;
//         cursor: pointer;
//     }
// `;

export const NavMenu = styled.div`
    display: flex;
    align-items: center;
    margin-right: -24px;
    @media screen and (max-width: 768px) {
        display: none;
    }
`;

export const NavBtn = styled.nav`
    font-size: 20px;
    display: flex;
    // align-items: center;
    padding: 0px;
    margin-left : 30px;
    }
`;

export const NavBtnLink = styled(Link)`
    border-radius: 4px;
    background: #808080;
    padding: 10px 22px;
    color: #000000;
    outline: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    text-decoration: none;
    margin-left: 24px;
    &:hover {
        transition: all 0.2s ease-in-out;
        background: #fff;
        color: #808080;
    }
`;