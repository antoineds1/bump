import * as Location from 'expo-location';
export const getLocation = async (spec) => {
	let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

    let location = await Location.getCurrentPositionAsync({});
	let regionName = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
	if(spec == "ville")
		return {name:"Ville", value:regionName[0].district}
	if(spec == "home")
		return {name:"Localisation", value:regionName[0].name+", "+regionName[0].city}
}
