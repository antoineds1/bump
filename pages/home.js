import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { loadAsync, useFonts } from 'expo-font';
import { DarkTheme, NavigationContainer, useFocusEffect, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { useWindowDimensions } from 'react-native';
import { Bump, BumpContainer, NobumpAtAll, Userbump } from '../components/bumps';
import { useContext, useEffect, useState } from 'react';
import AppContext from '../appcontext';
import { pb } from '../pocketbase';
import { FlatList, ScrollView as GestureHandlerScrollView } from 'react-native-gesture-handler'
import { BlurView } from 'expo-blur';
import { getFormattedDate, groupBumpsByDate } from '../function/date';
import { filterBump, getDates, listUniqueActivities, listUniqueLocalisation, listUniqueSports, listUniqueWithUsers } from '../function/sortBump';
import { Notifier, Easing } from 'react-native-notifier';
import { ProfilPicture } from '../components/profilpicture';


const month =  ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
export function TabViewHome(){
	const { userInfo, theme, setUserCurrentProfil, bumpsViewed, tabScroll } = useContext(AppContext);
	const dimensions = useWindowDimensions();
	const navigation = useNavigation()
	const [currentbumps, setCurrentbump] = useState({user:{}, bumps:[]});
	const cTime = Date.now();
	const insets = useSafeAreaInsets()
	const chargeUserbumps = async ()=>{

	}
	const showbumps = async (item)=> {
		const bumpsList = await pb.collection('bumps').getList(1, 50, {
			filter: 'date >= '+(Math.floor(Date.now() / 1000)-86400)+' && fromUser = "'+item.id+'"',
			expand:"with",
			sort:"-created"
		});
		if(bumpsList.items.length > 0){
			bumpsList.items[0]['reactions'] = []
			//const reactions = await pb.collection('reactions').getFullList({
			//	filter:'post = "'+bumpsList.items[0].id+'"',
			//	expand:'fromUser',
			//	sort: 'created',
			//});
		}
		setCurrentbump({user:item, bumps:bumpsList.items})
	}
	const getUserProfils = async (userId) => {
		var record = await pb.collection('bumppublic').getOne(userId, {
			expand: 'friends',
		});
		const bumpsList = await pb.collection('bumps').getList(1, 60, {
			filter: 'fromUser = "'+userId+'"',
			expand:"with",
		});
		record['bumps'] = bumpsList.items
		setUserCurrentProfil(record)
		
		tabScroll.current.scrollToEnd({animated:true})
	}
	useEffect(()=>{
		showbumps(userInfo)
	}, [userInfo])
	return(
		<View style={{flex:1, width:dimensions.width, marginTop:10}}>
			<ScrollView nestedScrollEnabled={true} showsHorizontalScrollIndicator={false} horizontal style={{flexDirection:"row", maxHeight:80, paddingLeft:10, marginTop:-10, paddingTop:10, zIndex:1000}} contentContainerStyle={{gap:8}}>
				<TouchableOpacity onPress={()=>{showbumps(userInfo)}} style={{width:68, height:68, borderRadius:100, justifyContent:"center", alignItems:"center", borderColor:true?"rgba(255,255,255,0.2)":"white", borderWidth:2}}>
					{userInfo.bumps[0]&&userInfo.bumps[0].expand.with!=undefined&&<View style={{position:"absolute", borderRadius:30, zIndex:100, top:-3,right:0, overflow:"hidden", borderColor:theme.gradientStart, borderWidth:2.5}}>
						<ProfilPicture userId={userInfo.bumps[0].expand.with[0].id} profilPicId={userInfo.bumps[0].expand.with[0].profilPicture} size={25}/>
					</View>}
					<ProfilPicture userId={userInfo.id} profilPicId={userInfo.profilPicture} size={59}/>
				</TouchableOpacity>
				{userInfo.expand.friends&&userInfo.expand.friends.map((item,index)=>{
					const hasbump = item.expand.lastbumps==null?false:item.expand.lastbumps.date>(cTime/1000)-86400;
					if(hasbump){
						const hasUnseedbump = hasbump?(!bumpsViewed.includes(item.expand.lastbumps.id)):false
						const taggedUserBump = item.expand.lastbumps.expand.with;
						const hasTaggedBump = taggedUserBump!=undefined;
						return(
							<TouchableOpacity onPress={()=>{item.expand.lastbumps==null?setCurrentbump({user:item, bumps:[]}):showbumps(item)}} key={index} style={{width:68, height:68, borderRadius:100, justifyContent:"center", alignItems:"center", borderColor:!hasUnseedbump?"rgba(255,255,255,0.2)":"white", borderWidth:2}}>
								{hasTaggedBump&&<View style={{position:"absolute", borderRadius:30, zIndex:100, top:-3,right:0, overflow:"hidden", borderColor:!hasUnseedbump?theme.gradientStart:"white", borderWidth:2.5}}>
									<ProfilPicture userId={taggedUserBump[0].id} profilPicId={taggedUserBump[0].profilPicture} size={25}/>
								</View>}
								<ProfilPicture userId={item.id} profilPicId={item.profilPicture} size={59}/>
							</TouchableOpacity>
						)
					}else{
						return(
							<TouchableOpacity onPress={()=>{setCurrentbump({user:item, bumps:[]})}} key={index} style={{width:68, height:68, borderRadius:100, justifyContent:"center", alignItems:"center", borderColor:"rgba(255,255,255,0.2)", borderWidth:2}}>
								<ProfilPicture userId={item.id} profilPicId={item.profilPicture} size={59}/>
							</TouchableOpacity>
						)
					}
				})}
				<View style={{height:75, width:10}}/>
			</ScrollView>
			<View style={{flex:1}}>
				{currentbumps.bumps.length>0&&<View style={{flex:1, marginTop:10, paddingBottom:insets.bottom}}><BumpContainer data={currentbumps} startIndex={0}/></View>}
				{currentbumps.bumps.length<1&&<View style={{flex:1, marginTop:10, marginBottom:insets.bottom, borderRadius:20, borderColor:theme.borderColor, borderWidth:0, overflow:"hidden"}}>
					{currentbumps.user.id!=userInfo.id&&<BlurView style={{flex:1, justifyContent:"center", alignItems:"center", paddingHorizontal:16, gap:20}}>
						<Text style={{fontSize:70}}>😫</Text>
						<Text style={{color:"white",fontSize:20, fontFamily:"CircularSpBold", letterSpacing:-0.4, textAlign:"center", lineHeight:25}}>{currentbumps.user.username} n'a pas posté de Bump aujourd'hui</Text>
						{<TouchableOpacity onPress={()=>{getUserProfils(currentbumps.user.id)}} style={{backgroundColor:"white", padding:15, paddingHorizontal:15, borderRadius:8, justifyContent:"center", paddingBottom:12}}>
							<Text style={{fontSize:15, fontFamily:"CircularSpBold", letterSpacing:-0.6, textAlign:"center", lineHeight:16}}>Voir le profil</Text>
						</TouchableOpacity>}
					</BlurView>}
					{currentbumps.user.id==userInfo.id&&<BlurView style={{flex:1, justifyContent:"center", alignItems:"center", paddingHorizontal:16, gap:20}}>
						<Text style={{fontSize:70}}>🫣</Text>
						<Text style={{color:"white",fontSize:20, fontFamily:"CircularSpBold", letterSpacing:-0.4, textAlign:"center", lineHeight:25}}>Content de vous revoir {currentbumps.user.username}</Text>
						{<TouchableOpacity onPress={()=>{navigation.navigate("TakeFit")}} style={{backgroundColor:"white", padding:15, paddingHorizontal:15, borderRadius:8, justifyContent:"center", paddingBottom:12}}>
							<Text style={{fontSize:20, fontFamily:"CircularSpBold", letterSpacing:-0.6, textAlign:"center", lineHeight:23}}>Poster votre Bump</Text>
						</TouchableOpacity>}
					</BlurView>}
				</View>}
				
				{false&&<BlurView intensity={10} tint='dark' style={{flex:1, zIndex:-1}}/>}
			</View>
		</View>
	)
}


function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}
function generateCalendarData(month, year) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    
    // Création d'un objet Date pour le premier jour du mois spécifié.
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // Création d'un objet Date pour le mois suivant et retranchement d'un jour pour obtenir le dernier jour du mois spécifié.
    const lastDayOfMonth = (month === currentMonth && year === currentYear) ? currentDay : new Date(year, month + 1, 0).getDate();
    
    // Construisons le décalage pour le premier jour du mois.
    let offset = new Array(firstDayOfMonth).fill(null);
    
    // Liste des jours du mois.
    let daysOfMonth = [...Array(lastDayOfMonth).keys()].map(i => i + 1);
    
    // Combinez tout dans un seul tableau.
    return ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM", ...offset, ...daysOfMonth];
}
export function TabViewProfils(){
	const [date, setDate] = useState(new Date())
	const dimensions = useWindowDimensions();
	const navigation = useNavigation();
	const {currentProfil, userInfo, theme} = useContext(AppContext);
	const [displayBump, setDisplayBump] = useState(groupBumpsByDate(currentProfil.bumps))
	const [currentMonth, setCurrentMonth] = useState(date.getMonth() + 1)
	const [currentYear, setCurrentYear] = useState(date.getFullYear())
	const [totalDataArray, setTotalDataArray] = useState(generateCalendarData(currentMonth-1, date.getFullYear()))
	const [highlightIndex, setHightlightIndex] = useState(Array.from({length: displayBump.length}, (_, i) => i))
	const datesArray = getDates(displayBump)


	const displayBefore = async(add, sens) => {
		const dateAtStartOfMonth = new Date(currentYear, add-1, 1, 0, 0, 0, 0);
		if(add == 0 || add == 13){
			setCurrentMonth(add==0?12:1)
			setCurrentYear((year)=>year+sens)
		}else{
			setCurrentMonth(add)
		}
		const resultList = await pb.collection('bumps').getList(1, 50, {
			filter: `date > ${dateAtStartOfMonth.getTime()/1000} && date < ${(dateAtStartOfMonth.getTime()/1000)+2629800} && fromUser = "${currentProfil.id}"`,
			sort: "-created",
			expand:"with"
		});
		const dispBump = groupBumpsByDate(resultList.items)
		setDisplayBump(dispBump)
		setHightlightIndex(Array.from({length: dispBump.length}, (_, i) => i))
		setTotalDataArray(generateCalendarData(add-1, date.getFullYear()))
	}

	const renderItem = ({ item, index }) => {
		const itemDate = currentYear+"-"+(currentMonth<10?"0"+currentMonth.toString():currentMonth)+"-"+(item<10?"0"+(item):item)
		const indexDate = datesArray.indexOf(itemDate)
		if(index > 6){
			return(
				<TouchableOpacity onPress={()=>{item!=undefined&&indexDate!=-1?navigation.navigate("Bump", {data:displayBump[indexDate], user:currentProfil}):null}} style={{opacity:highlightIndex.includes(indexDate)?1:0.6,width:(dimensions.width-32-(4*7))/7, height:70, backgroundColor:"transparent",margin:2, justifyContent:"center", alignItems:"center", borderRadius:8, overflow:"hidden"}}>
					{item!=undefined&&<Text style={{fontFamily:"CircularSpBold", fontSize:13, color:"white", padding:1}}>{item}</Text>}
					
					{item!=undefined&&indexDate!=-1&&<Image blurRadius={4} style={{position:"absolute", top:0, bottom:0, left:0, right:0, zIndex:-1}} source={{uri:"https://fitfeat.xyz/api/files/9sjagr7u7qz4p8x/"+displayBump[indexDate].bumps[0].id+"/"+(displayBump[indexDate].bumps[0].isVideo?displayBump[indexDate].bumps[0].preview:displayBump[indexDate].bumps[0].photo)+"?thumb=50x50"}}/>}
				</TouchableOpacity>
			)
		}else{return(<View style={{width:(dimensions.width-32-(4*7))/7, backgroundColor:"transparent",margin:2, justifyContent:"center", alignItems:"center", borderRadius:8, overflow:"hidden"}}><Text style={{fontFamily:"CircularSpBook", fontSize:9, color:"white", paddingVertical:10}}>{item}</Text></View>)}
	}
	
	useEffect(()=>{
		setDisplayBump(groupBumpsByDate(currentProfil.bumps))
	}, [currentProfil])
	return(
		<ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps='always' disableScrollViewPanResponder scrollEnabled style={{width:dimensions.width}}>
			<View style={{justifyContent:"center", alignItems:"center", gap:10, paddingHorizontal:16}}>
				<View style={{width:70, height:70, borderRadius:100, justifyContent:"center", alignItems:"center"}}>
					<ProfilPicture userId={currentProfil.id} profilPicId={currentProfil.profilPicture} size={70}/>
				</View>
				<Text style={{color:"white", fontSize:18, fontFamily:"CircularSpBook"}}>{currentProfil.username}</Text>
				<Text style={{color:"white", fontSize:16, fontFamily:"CircularSpBook", opacity:0.5, textAlign:"center", paddingHorizontal:20}}>{currentProfil.bio}</Text>
				<View style={{flexDirection:"row", gap:-20, alignItems:"center", paddingVertical:20}}>
					{currentProfil.expand.friends&&currentProfil.expand.friends.slice(0,3).map((item,index)=>{
						return(
							<ProfilPicture userId={item.id} profilPicId={item.profilPicture} size={40}/>
						)
					})}
					{currentProfil.expand.friends&&currentProfil.expand.friends.length>=2&&<Text numberOfLines={2} style={{color:"white", fontSize:10, fontFamily:"CircularSpBook", marginLeft:35}}>{currentProfil.expand.friends[0].username.toUpperCase()}, {currentProfil.expand.friends[1].username.toUpperCase()} {"\n"}ET {currentProfil.friends.length-2} AUTRE{currentProfil.friends.length-2>1?"S":""} SONT AMIS</Text>}
				</View>
			</View>
			{currentProfil.id==userInfo.id&&<View style={{flexDirection:"row", justifyContent:"space-evenly", gap:10, marginVertical:10, paddingHorizontal:16}}>
				<TouchableOpacity  onPress={()=>{navigation.navigate("ModifProfil")}} style={{backgroundColor:"rgb(38,38,38)", borderRadius:10, paddingVertical:12, justifyContent:"center", alignItems:"center", flex:1}}>
					<Text style={{fontFamily:"CircularSpBold", color:"white", fontSize:15, letterSpacing:-0.4}}>Modifier le profil</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={()=>{navigation.navigate("Friends")}} style={{backgroundColor:"rgb(38,38,38)", borderRadius:10, paddingVertical:12, justifyContent:"center", alignItems:"center",flex:1}}>
					<Text style={{fontFamily:"CircularSpBold", color:"white", fontSize:15, letterSpacing:-0.4}}>Gestion des amis</Text>
				</TouchableOpacity>
			</View>}
			{currentProfil.id!=userInfo.id&&<TouchableOpacity style={{backgroundColor:"white", borderRadius:10, paddingVertical:12, justifyContent:"center", alignItems:"center", marginHorizontal:16}}>
				<Text style={{fontFamily:"CircularSpBold", color:!userInfo.friends.includes(currentProfil.id)?"white":"black", fontSize:17, letterSpacing:-0.4}}>{"Ne plus suivre"}</Text>
			</TouchableOpacity>}
			
			<View style={{}}>
				<View style={{justifyContent:"space-between", flexDirection:"row", paddingVertical:20, paddingHorizontal:16}}>
					<TouchableOpacity onPress={()=>{displayBefore(currentMonth-1, -1)}}>
						<Text style={{color:"white"}}>mois avant</Text>
					</TouchableOpacity>
					<Text style={{color:"white"}}>{month[currentMonth-1]}, {currentYear}</Text>
					<TouchableOpacity onPress={()=>{displayBefore(currentMonth+1, +1)}}>
						<Text style={{color:"white"}}>mois apres</Text>
					</TouchableOpacity>
				</View>
				<FlatList
					scrollEnabled={false}
					data={totalDataArray}
					renderItem={renderItem}
					style={{alignSelf:"center", marginTop:20, paddingBottom:100}}
					keyExtractor={(item, index) => index}
					numColumns={7} // 10 items per row
				/>
			</View>
		</ScrollView>
	)
}