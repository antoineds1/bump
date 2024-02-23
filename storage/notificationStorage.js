import { getData, storeData } from "./viewed";

export const hasExpoPushToken = async () => {
	const token = await getData("notifToken");
	return token != null ? true : false;
}
export const saveExpoPushToken = async (token) => {
	await storeData("notifToken", token);
}
