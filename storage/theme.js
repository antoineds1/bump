import { getData, storeData } from "./viewed"

export const getSavedTheme = async () => {
	const themeValue = await getData("theme");
	if(themeValue == null){
		return {gradientStart:"#898989", gradientEnd:"#000000", borderColor:"#D8D3D8"}
	}else{
		return themeValue;
	}
}
export const setSavedTheme = async (theme) => {
	const themeValue = await storeData("theme", theme);
}