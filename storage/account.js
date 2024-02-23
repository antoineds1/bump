import { getData, storeData } from "./viewed";

export async function getAccountStorage(){
	const userInfo = await getData("userInfo")
	return userInfo
}

export async function saveAccountStorage(userInfo){
	await storeData("userInfo", userInfo)
}