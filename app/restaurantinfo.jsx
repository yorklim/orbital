import { useLocalSearchParams, useRouter } from "expo-router"
import { Image, Linking, View } from "react-native"
import MapView, {Marker, PROVIDER_GOOGLE} from "react-native-maps";
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase";
import { IconButton, PaperProvider, Text } from "react-native-paper";
import MapViewDirections from "react-native-maps-directions";
import { GOOGLE_API_KEY } from "../key";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Restaurantinfo() {
    const [store, setStore] = useState();
    const {lon,lat,id, slat, slon} = useLocalSearchParams();
    const router = useRouter();


    useEffect(() => {
        fetchstore();
    },[])

    async function fetchstore() {
        let { data } = await supabase.from('restaurant').select().eq('id_source', id)
        setStore(data[0])
    }

    return (
    <SafeAreaView style = {{flex: 1}}>
        <PaperProvider>
        <MapView
            style ={{flex: 1, width: '100%', height: '100%'}}
            provider={PROVIDER_GOOGLE}
            region = {{
                latitude: (parseFloat(lat) + parseFloat(slat))/2,
                longitude: (parseFloat(lon) + parseFloat(slon))/2,
                latitudeDelta: 0.007,
                longitudeDelta: 0.002
                }}
        >
            <MapViewDirections
                origin = {{ latitude: lat, longitude: lon}}
                destination = {{ latitude: slat, longitude: slon}}
                apikey= {GOOGLE_API_KEY}
                mode = "WALKING"
                strokeWidth = {3}
                strokeColor = "lime" 
            />
                

            <Marker
                coordinate = {{
                    latitude : lat,
                    longitude: lon

                }}>

                <Image
                    style = {{height:30, width: 30}}
                    source ={require("../assets/userpin.png")}/>
            </Marker>

            <Marker
                coordinate={{
                latitude: slat,
                longitude: slon
                    }}>
                    <Image
                        style = {{height:30, width: 30}}
                        source ={require("../assets/restaurantpin2.png")}/>
            </Marker>
        </MapView>
        <View style = {{flex: 1, paddingTop: 5}}>
            {store !== undefined && <View>
                <Text style={{ fontWeight:"bold", fontSize: 25}}>
                    {store.address}
                </Text>
                <Text style={{ fontSize: 15}}>
                    Cuisine: {store.cuisine.slice(1).reduce((acc, val) => acc + " · " + val, store.cuisine[0])}
                </Text>
                <Text style={{ fontSize: 15}}>
                    Rating: {store.rating} ⭐
                </Text>
                <Text style={{ fontSize: 15}}>
                    Distance: {Math.round(getDistanceFromLatLonInM(lat,lon,slat,slon))} m
                </Text>
                <Image
                    source = {{uri: store.image_url}}
                    style = {{
                        height: 180,
                        width: 320,
                        objectFit: 'contain',
                    }}
                />
                <Text onPress= {()=> Linking.openURL("https://www.google.com/search?q=" + [store.address])} style= {{color:"blue"}}>Web Search</Text>
            </View>}
        </View>

        <IconButton style = {{backgroundColor: 'white', position: "absolute"}} icon = 'arrow-left' onPress={() => router.back()}/>
        
        </PaperProvider>
    </SafeAreaView>
    )
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
  }

function getDistanceFromLatLonInM(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c * 1000; // Distance in M
    return d;
  }