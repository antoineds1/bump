import { Image } from "expo-image";

export function ProfilPicture(props){
	console.log(props)
	if(props.profilPicId != ""){
		return(
			<Image source={{uri:"https://fitfeat.xyz/api/files/swe3s17d84b6w6r/"+props.userId+"/"+props.profilPicId}} style={{width:props.size, height:props.size, borderRadius:100}}/>
		)
	}else{
		return(
			<Image source={{uri:"https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"}} style={{width:props.size, height:props.size, borderRadius:100}}/>
		)
	}
}