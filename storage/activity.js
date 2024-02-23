import { getData, storeData } from "./viewed";

export const getSavedActivity = async () => {
	const viewed = await getData("activityStorage");
	return viewed != null ? viewed : [];
}

export const addSavedActivity = async (newActivity) =>{
	const savedActivity = await getSavedActivity();
	const newSaved = [...savedActivity, newActivity];
	await storeData("activityStorage", newSaved)
}