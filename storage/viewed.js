import AsyncStorage from '@react-native-async-storage/async-storage';
export const getData = async (key) => {
	try {
	  const jsonValue = await AsyncStorage.getItem(key);
	  return jsonValue != null ? JSON.parse(jsonValue) : null;
	} catch (e) {
	  // error reading value
	}
};
export const removeValue = async (key) => {
	try {
	  await AsyncStorage.removeItem(key)
	} catch(e) {
	  // remove error
	}
  
	console.log('Done.')
  }
export const getbumpsViewed = async () => {
	const viewed = await getData("bumpsViewed");
	return viewed != null ? viewed : [];
}
export const storeData = async (key,value) => {
	try {
	  const jsonValue = JSON.stringify(value);
	  await AsyncStorage.setItem(key, jsonValue);
	} catch (e) {
	  console.log(e)
	}
};
export const addbumpsViewed = async (bumpId) => {
	const viewedbumps = await getbumpsViewed()
	const newViewedbumps = [...viewedbumps,bumpId]
	await storeData("bumpsViewed", newViewedbumps)
	return newViewedbumps
}