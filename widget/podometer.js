import { Pedometer } from "expo-sensors";

export const getPodometer = async () => {
	const isAvailable = await Pedometer.isAvailableAsync();
	const permissions = await Pedometer.getPermissionsAsync();
	if(isAvailable){
		if(!permissions.granted){
			const perm = await Pedometer.requestPermissionsAsync()
			const end = new Date();
			const start = new Date();
			start.setDate(end.getDate() - 1);
			const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
			return { name:"Nombre de pas", value:pastStepCountResult.steps}
		}else{
			const end = new Date();
			const start = new Date();
			start.setDate(end.getDate() - 1);
			const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
			return {name:"Nombre de pas", value:pastStepCountResult.steps}
		}
	}
	return -1
}