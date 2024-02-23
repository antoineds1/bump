import { View,Text } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useContext } from "react";
import AppContext from "../appcontext";
import { pb } from "../pocketbase";
import { useNavigation } from "@react-navigation/native";
import { saveExpoPushToken } from "../storage/notificationStorage";

export function NotificationsScreen(){
	const insets = useSafeAreaInsets();
	const { userInfo, theme, setUserCurrentProfil, bumpsViewed } = useContext(AppContext);
	const navigation = useNavigation()
	const getPushToken = async() =>{
		if (Constants.isDevice) {
			const { status: existingStatus } = await Notifications.getPermissionsAsync();
			let finalStatus = existingStatus;
			if (existingStatus !== 'granted') {
				const { status } = await Notifications.requestPermissionsAsync();
				finalStatus = status;
			}
			if (finalStatus !== 'granted') {
				alert('Failed to get push token for push notification!');
				return;
			}
			token = (await Notifications.getExpoPushTokenAsync()).data;
			const data = {
				"expoPushToken": token
			};
			const record = await pb.collection('bumpusers').update(userInfo.id, data);
			await saveExpoPushToken(token)
			navigation.navigate("Home")
		}
	}
	
	return(
		<View style={{flex:1, paddingTop:insets.top+16, paddingHorizontal:25, justifyContent:"space-between", paddingBottom:insets.bottom}}>
			<Text style={{fontSize:60, alignSelf:"center"}}>📣</Text>
			<Text style={{fontSize:21, fontFamily:"CircularSpBold", letterSpacing:-0.6, textAlign:"center", lineHeight:22, color:"white"}}>Bump a besoin des notifications pour que vous soyez alerté de l'avancé de vos amis</Text>
			<TouchableOpacity onPress={()=>{getPushToken()}} style={{backgroundColor:"white", padding:14, borderRadius:10}}>
				<Text style={{fontSize:18, fontFamily:"CircularSpBold", letterSpacing:-0.6, textAlign:"center"}}>Autoriser les notifications</Text>
			</TouchableOpacity>
		</View>
	)
}