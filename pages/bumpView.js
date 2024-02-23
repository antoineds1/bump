import { View } from "react-native";
import { BumpContainer } from "../components/bumps";
import { useEffect } from "react";
import { Image } from 'expo-image';

export function BumpPage({route}){
	const data = route.params.data;
	const user = route.params.user;
	useEffect(()=>{
		return () => {
			Image.clearMemoryCache()
		}
	}, [])
	return(
		<View style={{flex:1, paddingBottom:40}}>
			<BumpContainer isProfil data={{user:user, bumps:data.bumps}} startIndex={0}/>
		</View>
	)
}