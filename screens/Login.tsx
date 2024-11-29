import React, {useEffect, useState} from 'react';
import {
    View,
    TextInput,
    Text,
    Alert,
    StyleSheet,
    Image,
    Keyboard,
    Platform,
    TouchableWithoutFeedback,
    StatusBar,
} from 'react-native';
import AnimationLoader from '../AnimationLoader';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RFValue} from 'react-native-responsive-fontsize';
import AvoidKeyboardContainer from '../components/AvoidKeyboardContainer';
import * as LocalAuthentication from 'expo-local-authentication';
import DeviceInfo from 'react-native-device-info';
import fs from 'react-native-fs';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    fetchUserCredentialsFromServer,
    fetchTeamDataFromServer,
    fetchEventNameFromServer,
    fetchAfterLogin,
    fetchFormsFromServer,
} from '../authentication/api';
import {supabase} from '../supabase';
// import * as os from "node:os";
import * as Keychain from 'react-native-keychain';
import { Button } from 'react-native-paper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const Login = ({
    setUser,
    setEventName,
    appVersion,
    setTeamData,
    setOfflineMode,
}: {
    setUser: (user: any) => void;
    setEventName: (eventName: string) => void;
    appVersion: string;
    setTeamData: (teamData: any) => void;
    setOfflineMode: (offlineMode: boolean) => void;
}) => {
    const [username, setUsername] = useState('');
    const [osis, setOsis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    useEffect(() => {
        (async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            setIsBiometricSupported(compatible);
        })();
    });

    const storeCredentials = async (username: string, password: string) => {
        await Keychain.setGenericPassword(username, password);
    };

    const retrieveCredentials = async () => {
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
            return {
                username: credentials.username,
                password: credentials.password,
            };
        } else {
            return null;
        }
    };

    const handleBiometricLogin = async () => {
        if (!isBiometricSupported) {
            Alert.alert(
                'Biometric authentication is not supported on this device',
            );
            return;
        }

        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
            Alert.alert('No biometrics enrolled');
            return;
        }

        const auth = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate',
        });

        // add security check to delete entry after 5 days

        if (auth.success) {
            try {
                // login info request
                const credentials = await retrieveCredentials();

                if (credentials === null) {
                    Alert.alert(
                        'No credentials stored',
                        'Please log in manually',
                    );
                    return;
                }

                // const userData = await fetchUserCredentialsFromServer(
                //     credentials.username,
                //     credentials.password,
                //     appVersion,
                // );

                await handleLogin(credentials.username, credentials.password);

                // if (!userData) {
                //     Alert.alert(
                //         'App Version Mismatch',
                //         'Please update the app',
                //     );
                //     return;
                // }

                // const eventName = await fetchEventNameFromServer();
                // setEventName(eventName.name);
                //
                // // team data request
                // const allTeamData = await fetchTeamDataFromServer();
                // setTeamData(allTeamData);
                //
                // if (userData.authenticated !== false) {
                //     const user = userData;
                //     console.log(user);
                //     setUser(user);
                // } else {
                //     console.error('Incorrect username or password');
                //     Alert.alert('Incorrect username or password');
                // }
            } catch (error) {
                Alert.alert('Error connecting to the server', String(error));
                console.error('Error connecting to the server', error);
            } finally {
                setIsLoading(false);
            }
        } else {
            console.log('Authentication failed');
        }
    };

    const handleLogin = async (_userName: string, password: string) => {
        setIsLoading(true);
        setOfflineMode(false);

        if (osis === '101') {
            console.log('Logging in with offline mode');
            setOfflineMode(true);
            await handleOfflineLogin();
            return;
        }

        storeCredentials(_userName, password);

        try {
            // login info request
            
            // assessment for scout app people have them solve this issue
            // .includes() is a method that checks if a string contains another string
            // if the string does not contain the other string, it will return false
            // if the string does contain the other string, it will return true
            // for example, "hello".includes("he") will return true
            // "hello".includes("hi") will return false
            // with this knowledge, make it so taht you can login with just your username or email
            // if the username does not contain "@nycstudents.net"
            // then add "@nycstudents.net"
            // this will allow you to login with just your username
            // if you want to login with your email, you can just type your email
            if (!_userName.includes('@nycstudents.net')) {
                _userName = _userName + '@nycstudents.net';
            }

            const {data, error} = await supabase.auth.signInWithPassword({
                email: _userName, // supabase uses email so just add domain at the end
                password: password,
            });

            if (error) {
                Alert.alert('Incorrect username or password');
                return;
            }

            const userData = data.user?.user_metadata;
            console.log(userData);

            console.log(data.session?.access_token);

            const userAuthenticity = await fetchAfterLogin(
                username,
                osis,
                appVersion,
                await data.session?.access_token,
            );
            if (!userAuthenticity) {
                Alert.alert('App Version Mismatch', 'Please update the app');
                return;
            }

            const eventName = await fetchEventNameFromServer();
            setEventName(eventName.name);
            //
            // // team data request
            const allTeamData = await fetchTeamDataFromServer();
            setTeamData(allTeamData);

            await fetchFormsFromServer();


            const user = {
                id: userData.sub,
                name: userData.name,
                username: userData.username,
                osis: userData.osis,
                email: userData.email,
                role: userData.role,
            };

            console.log(user);
            setUser(user);
        } catch (error) {
            Alert.alert('Error connecting to the server', String(error));
            console.error('Error connecting to the server', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOfflineLogin = async () => {
        try {
            const path = fs.DocumentDirectoryPath + '/data/teamData.json';
            const content = await fs.readFile(path, 'utf8');
            const teamData = JSON.parse(content);
            setTeamData(teamData);

            const eventPath = fs.DocumentDirectoryPath + '/data/eventName.json';
            const eventContent = await fs.readFile(eventPath, 'utf8');
            const eventName = JSON.parse(eventContent);
            setEventName(eventName.name);

            const offlineUserName = await new Promise((resolve, reject) => {
                if (Platform.OS === 'ios') {
                    Alert.prompt(
                        'Offline Mode',
                        'Please enter your name:',
                        userName => resolve(userName),
                        'plain-text',
                        '',
                        'default',
                    );
                } else {
                    if (username === null) {
                        Alert.alert(
                            'Offline Mode',
                            'Please enter your NAME in the username section.',
                            [
                                {
                                    text: 'Ok',
                                },
                            ],
                        );
                        setUsername('');
                        return;
                    }

                    resolve(username);
                }
            });

            const user = {
                id: 1,
                name: offlineUserName,
                osis: '1234',
                password: '1234',
                username: 'Offline User',
            };
            setUser(user);
        } catch (error) {
            setIsLoading(false);
            Alert.alert(
                'Error with retrieving offline data',
                'Please connect to a server as soon as possible to sync.',
                [{text: String(error)}],
            );
        } finally {
        }
    };

    const chooseLoginType = async () => {
        if (
            isBiometricSupported &&
            (await AsyncStorage.getItem('biometric')) === 'true' &&
            username === '' &&
            osis === ''
        ) {
            handleBiometricLogin();
        } else {
            JSON.stringify(await AsyncStorage.setItem('biometric', 'false'));
            handleLogin(username, osis);
        }
    };

    const navigation = useNavigation();

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View>
                <View style={styles.container}>
                    <Image
                        source={require('../assets/background.png')}
                        style={styles.image}
                    />

                    <View style={styles.imageLayer}>
                        <Animated.Image
                            entering={FadeInUp.delay(200).duration(1000).springify()}
                            style={styles.icons}
                            source={require('../assets/hawk.png')}
                        />
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inner}>
                            <Animated.Text entering={FadeInUp.delay(400).duration(1000).springify()} style={styles.title}>Login</Animated.Text>
                        </View>
                    </View>

                    <Text style={[styles.title, {marginTop: RFValue(50)}]}>
                        Hello
                    </Text>

                    <Animated.View style={styles.login} entering={FadeInDown.delay(600).duration(1000).springify()}>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={'white'}
                            placeholder="Username/Email"
                            onChangeText={text => setUsername(text)}
                            value={username}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={'white'}
                            placeholder="OSIS"
                            onChangeText={text => setOsis(text)}
                            value={osis}
                            keyboardType="numeric"
                        />
                        <Icon.Button
                            borderRadius={5}
                            name="log-in"
                            size={RFValue(25)}
                            color="white"
                            backgroundColor="rgba(136, 3, 21, 1)"
                            underlayColor="transparent"
                            style={styles.iconButton}
                            onPress={chooseLoginType}>
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    fontSize: 20,
                                    color: 'white',
                                }}>
                                Log In
                            </Text>
                        </Icon.Button>
                    </Animated.View>

                    <Animated.View style={styles.switchView} entering={FadeInDown.delay(800).duration(1000).springify()}>
                        <Text style={{color: 'white'}}>Don't have an account?</Text>
                        <Button
                            style={{paddingBottom: RFValue(1)}}
                            onPress={() => {
                                navigation.navigate("Create Account");
                            }}>Sign Up</Button>
                    </Animated.View>

                    <Animated.Text style={styles.footer} entering={FadeInDown.delay(800).duration(1000).springify()}>
                        Developed by Steel Hawks {'\n'}
                        Version: {appVersion}
                    </Animated.Text>
                </View>

                <AnimationLoader
                    isLoading={isLoading}
                    onAnimationComplete={undefined}
                />
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    switchView: {
        padding: 0,
        margin: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    login: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inner: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '80%', // Adjust the width as needed
    },
    form: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: 'white',
        height: '100%',
        width: '100%',
    },
    icons: {
        resizeMode: 'contain',
        height: 100,
        width: 200,
        marginTop: RFValue(80),
        marginBottom: 50,
    },
    imageLayer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        position: 'absolute',
    },
    title: {
        fontSize: RFValue(40),
        marginTop: RFValue(150),
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    iconButton: {
        alignSelf: 'center',
        fontWeight: 'bold',
        fontSize: 20,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        zIndex: 1,
    },
    imageContainer: {
        alignItems: 'center',
    },
    image: {
        backgroundColor: '#222',
        height: '100%',
        width: '100%',
        position: 'absolute',
    },
    background: {
        flex: 1,
        justifyContent: 'center',
    },
    input: {
        paddingVertical: RFValue(12),
        paddingHorizontal: RFValue(15),
        height: RFValue(40),
        borderRadius: RFValue(8),
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        marginBottom: RFValue(10),
        backgroundColor: 'rgba(24, 24, 25, 0.5)',
        color: '#F9FAFB',
        width: '80%',
        fontSize: RFValue(16),
    },
    button: {
        backgroundColor: 'lightblue',
        padding: RFValue(15),
        borderRadius: RFValue(5),
        marginHorizontal: '10%',
    },
    buttonText: {
        color: 'black',
        fontSize: RFValue(20),
        alignSelf: 'center',
        fontWeight: 'bold',
    },
    footer: {
        // top: 15,
        color: 'white',
        fontSize: RFValue(10),
        alignSelf: 'center',
        fontWeight: 'bold',
        alignContent: 'center',
        textAlign: 'center',
    },
});

export default Login;
