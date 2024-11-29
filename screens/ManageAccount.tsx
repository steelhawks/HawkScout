import React, {useState} from 'react';
import {View, Text, StyleSheet, Modal, TouchableOpacity} from 'react-native';
import AnimationLoader from '../AnimationLoader';
import {RFValue} from 'react-native-responsive-fontsize';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {Platform} from 'react-native';
import SettingsPage from './SettingsPage';
import {useDictStore, usePitDict} from '../contexts/dict.jsx';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {CameraView} from '../components/CameraView';
import {supabase} from "../supabase";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Stack = createNativeStackNavigator();

const STEEL_HAWKS_URL = 'https://www.steelhawks.org/';

// use for typescript migration
interface ManageAccountProps {
    setUser: (user: any) => void;
    user: any;
    appVersion: string;
    eventName: string;
    navigation: any;
}

const ManageAccount: React.FC<ManageAccountProps> = ({setUser, user, appVersion, eventName, navigation}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const setDict = useDictStore(state => state.setDict);
    const setPitDict = usePitDict(state => state.setDict);
    const resetDict = useDictStore(state => state.resetDict);
    const resetPitDict = usePitDict(state => state.resetDict);

    const logOut = async () => {
        // clean up before logout

        // remove all async storage
        // await AsyncStorage.removeItem('username');
        // await AsyncStorage.removeItem('osis');

        // first clear the reactive variables
        setDict('matchNumber', null);
        setDict('driveStation', null);

        // then reset dict
        resetDict();
        resetPitDict();

        // then logout
        setUser(null);
        await supabase.auth.signOut();
        setIsLoading(false);
    };

    const openLinkInBrowserHandler = async () => {
        InAppBrowser.isAvailable().then(() => {
            if (Platform.OS === 'ios') {
                return InAppBrowser.open(STEEL_HAWKS_URL, {
                    animated: true,
                    modalEnabled: true,
                    showTitle: true,
                });
            } else if (Platform.OS === 'android') {
                return InAppBrowser.open(STEEL_HAWKS_URL, {
                    // animated: false,
                    modalEnabled: true,
                    showTitle: true,
                });
            }
        });
    };

    const Settings = () => {
        return (
            <SettingsPage
                navigation={navigation}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
                appVersion={appVersion}
            />
        );
    };

    const ManageAccount = () => {
        return (
            <SafeAreaView style={styles.avoidTabBar}>
                <View style={styles.container}>
                    <Text style={styles.title}>Manage Account</Text>
                    <View style={styles.centerContent}>
                        <Text style={styles.welcomeText}>
                            Hello {user.name} {'\n'}
                            {user.username !== 'Offline User' && (
                                <>
                                    Username: {user.username} {'\n'}
                                    OSIS: {user.osis} {'\n'}
                                </>
                            )}
                            Event: {eventName} {'\n'}
                            App Version: {appVersion} {'\n'}
                        </Text>
                        <Icon.Button
                            borderRadius={5}
                            name="log-out"
                            size={RFValue(25)}
                            color="white"                            
                            backgroundColor="rgba(136, 3, 21, 1)"
                            underlayColor="transparent"
                            style={{
                                backgroundColor: 'transparent',
                                borderColor: 'transparent',
                                fontWeight: 'bold',
                                fontSize: 20,
                                padding: 10,
                                zIndex: 1,
                            }}
                            onPress={logOut}>
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    fontSize: 20,
                                    color: 'white',
                                }}>
                                Log Out
                            </Text>
                        </Icon.Button>
                    </View>
                    <AnimationLoader isLoading={isLoading} onAnimationComplete={undefined} />
                </View>
                <View
                    style={{
                        borderWidth: 0,
                        position: 'absolute',
                        alignSelf: 'flex-start',
                        bottom: RFValue(110),
                    }}>
                    <Icon.Button
                        name="globe"
                        size={RFValue(25)}
                        color="white"
                        backgroundColor="transparent"
                        underlayColor="transparent"
                        style={{
                            paddingLeft: RFValue(10),
                            backgroundColor: 'transparent',
                            borderColor: 'transparent',
                            zIndex: 1,
                        }}
                        onPress={() => {
                            openLinkInBrowserHandler();
                        }}
                    />
                </View>

                <View
                    style={{
                        borderWidth: 0,
                        position: 'absolute',
                        alignSelf: 'flex-end',
                        bottom: RFValue(110),
                    }}>
                    <Icon.Button
                        name="settings"
                        size={RFValue(25)}
                        color="white"
                        backgroundColor="transparent"
                        underlayColor="transparent"
                        style={{
                            backgroundColor: 'transparent',
                            borderColor: 'transparent',
                            zIndex: 1,
                        }}
                        onPress={() => {
                            navigation.navigate('Settings');
                        }}
                    />
                    {((user.role === 'scouter' ||
                        user.role === 'admin' ||
                        user.username === 'Offline User') && (
                            <Icon.Button
                                name="edit"
                                size={RFValue(25)}
                                color="white"
                                backgroundColor="transparent"
                                underlayColor="transparent"
                                style={{
                                    backgroundColor: 'transparent',
                                    borderColor: 'transparent',
                                    zIndex: 1,
                                }}
                                onPress={() => {
                                    navigation.navigate('Scan Data');
                                }}
                            />
                        ))}
                </View>
            </SafeAreaView>
        );
    };

    const ScanNavigate = (props: any) => {
        return (
            <SafeAreaView style={styles.avoidTabBar}>
                <CameraView {...props} navigation={navigation} />
            </SafeAreaView>
        );
    };

    return (
        <Stack.Navigator
            initialRouteName="Manage Account"
            screenOptions={{headerShown: true, headerBackButtonMenuEnabled: true, headerBackVisible: true}}>
            <Stack.Screen name="Manage Account" component={ManageAccount} options={{headerShown: false}} />
            <Stack.Screen name="Settings" component={Settings} />
            {((user.role === 'scouter' ||
                user.role === 'admin' ||
                user.username === 'Offline User') && (
                    <Stack.Screen name="Scan Data" component={ScanNavigate} />
                ))}
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    text: {
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
    },
    modalContainer: {
        // flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'rgba(30, 30, 30, 1)',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
    },
    avoidTabBar: {
        flex: 1,
        backgroundColor: '#121212',
        paddingBottom: RFValue(60),
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        paddingLeft: 50,
        paddingRight: 50,
        borderTopLeftRadius: RFValue(16),
        borderTopRightRadius: RFValue(16),
        top: 30,
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
        borderRadius: RFValue(10),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3, // paddingTop: RFValue(12),
        // paddingBottom: RFValue(12),

        padding: RFValue(16),
        width: '90%',
        alignSelf: 'center',
    },
    title: {
        position: 'absolute',
        // paddingBottom: RFValue(300),
        height: '70%',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: RFValue(20),
        color: 'white',
        textAlign: 'center',
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: RFValue(30),
        color: 'white',
    },
    infoText: {
        color: 'white',
        textAlign: 'center',
        position: 'absolute',
        bottom: RFValue(65),
    },
    scrollView: {
        flexGrow: 1,
        alignItems: 'center',
    },
});

export default ManageAccount;
