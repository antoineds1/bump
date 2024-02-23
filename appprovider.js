import React, { useEffect, useRef, useState } from 'react';
import AppContext from './appcontext';
import { getSavedTheme, setSavedTheme } from './storage/theme';

const AppInfoProvider = ({ children }) => {
    const availableThemes = [
        {gradientStart:"#000000", gradientEnd:"#000000", borderColor:"#FFFFFF"},
        {gradientStart:"#778D45", gradientEnd:"#000000", borderColor:"#AEC670"},
        {gradientStart:"#C0587E", gradientEnd:"#000000", borderColor:"#D0829E"},
        {gradientStart:"#9E8279", gradientEnd:"#65483D", borderColor:"#C2B1AB"},

        {gradientStart:"#958772", gradientEnd:"#000000", borderColor:"#E0D0AD"},
        {gradientStart:"#284C73", gradientEnd:"#000000", borderColor:"#3571B3"},
        {gradientStart:"#8c549c", gradientEnd:"#8787ff", borderColor:"#A587FF"},
        {gradientStart:"#fd7474", gradientEnd:"#ffd3a9", borderColor:"#FEBABA"}
    ]
    const [userInfo, setUserInfo] = useState({});
	const [currentProfil, setUserCurrentProfil] = useState()
    const [theme, setTheme] = useState({gradientStart:"#DA8A56", gradientEnd:"#DF996B", borderColor:"#E8B695"})
    const [bumpsViewed, setbumpsViewed] = useState([])

    useEffect(() => {
        getSavedTheme().then((t)=>{setTheme(t)})
    }, [])

	const tabScroll = useRef()
    return (
        
        <AppContext.Provider value={{ theme, setTheme, userInfo, setUserInfo, currentProfil, setUserCurrentProfil,tabScroll,setbumpsViewed, bumpsViewed, availableThemes, setTheme}}>
            {children}
        </AppContext.Provider>
    );
};

export default AppInfoProvider;