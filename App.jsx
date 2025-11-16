import 'react-native-gesture-handler';
/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/no-unstable-nested-components */
import {useState} from 'react';
import Login from './screens/Login';
import CreateAccount from './screens/CreateAccount';
import ScoutingPage from './screens/ScoutingPage';
import DataPage from './screens/DataPage';
import ManageAccount from './screens/ManageAccount';
import {NavigationContainer} from '@react-navigation/native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {StyleSheet, StatusBar, AppState} from 'react-native';
import {NewMatch} from '.';
import PitScoutingPage from './screens/PitScoutingPage';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import {BlurView} from '@react-native-community/blur';
import {RFValue} from 'react-native-responsive-fontsize';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
    RequestDefaultPermissions,
    RequestNotifications,
} from './permissions/RequestPermissions';
import DeviceInfo from 'react-native-device-info';
import {supabase} from "./supabase";
import { createStackNavigator } from '@react-navigation/stack';

AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh()
    } else {
        supabase.auth.stopAutoRefresh()
    }
})

const Tab = createBottomTabNavigator(); // new
const appVersion = 'v' + DeviceInfo.getVersion().toString();

const App = () => {
    const [user, setUser] = useState(null);
    const [eventName, setEventName] = useState(null);
    const [matchCreated, setMatchCreated] = useState(false);
    const [offlineMode, setOfflineMode] = useState(false);

    const [teamData, setTeamData] = useState(null);

    // NewMatch VARS
    const [scoutingType, setScoutingType] = useState('Match Scouting'); // either pit scout or match scout

    const NewMatchNavigate = props => {
        RequestNotifications();
        return (
            <NewMatch
                {...props}
                teamData={teamData}
                setMatchCreated={setMatchCreated}
                setScoutingType={setScoutingType}
                scoutingType={scoutingType}
                eventName={eventName}
                offlineMode={offlineMode}
                user={user}
            />
        );
    };

    const ScoutingPageNavigate = props => {
        return (
            <ScoutingPage
                {...props}
                user={user}
                eventName={eventName}
                setMatchCreated={setMatchCreated}
                offlineMode={offlineMode}
            />
        );
    };

    const PitScoutingPageNavigate = props => {
        return (
            <PitScoutingPage
                {...props}
                user={user}
                eventName={eventName}
                setMatchCreated={setMatchCreated}
            />
        );
    };

    const AccountManagementNavigate = props => {
        return (
            <ManageAccount
                {...props}
                setUser={setUser}
                user={user}
                appVersion={appVersion}
                setEventName={setEventName}
                eventName={eventName}
            />
        );
    };

    const LoginPageNavigate = props => {
        const Tab = createStackNavigator();
        // request permissions
        RequestDefaultPermissions();

        const LoginPage = props => {
            return (
                <Login
                    {...props}
                    user={user}
                    setEventName={setEventName}
                    setTeamData={setTeamData}
                    setUser={setUser}
                    appVersion={appVersion}
                    setOfflineMode={setOfflineMode}
                />
            );
        };

        return (
            <Tab.Navigator>
                <Tab.Screen
                    name="Login"
                    component={LoginPage}
                    initialParams={{setUser: setUser}}
                    options={{
                        headerShown: false
                    }}
                />
                <Tab.Screen
                    name="Create Account"
                    component={CreateAccount}
                    initialParams={{setUser: setUser}}
                />
            </Tab.Navigator>
        );
    };

    const DataPageNavigate = props => {
        return (
            <DataPage
                {...props}
                matchCreated={matchCreated}
                setUser={setUser}
                offlineMode={offlineMode}
            />
        );
    };

    return (
        // eslint-disable-next-line react-native/no-inline-styles
        <SafeAreaView style={{flex: 1}}>
            <StatusBar translucent backgroundColor="transparent" />
            <NavigationContainer
                initialRouteName="Login"
                backBehavior="firstRoute"
                theme={{
                    dark: true,
                    colors: {
                        primary: '#222',
                        background: '#222',
                        card: '#222',
                        text: 'white',
                        border: '#222',
                        notification: '#222',
                        select: 'blue',
                    },
                }}>
                {user != null ? (
                    <Tab.Navigator
                        initialRouteName="Login"
                        screenOptions={{
                            tabBarHideOnKeyboard: true,
                            headerShown: false,
                            activeBackgroundColor: 'white',
                            tabBarActiveBackgroundColor: 'white',
                            activeTintColor: 'white',
                            tabBarStyle: {
                                position: 'absolute',
                                bottom: RFValue(25),
                                left: RFValue(20),
                                right: RFValue(20),
                                elevation: 0,
                                backgroundColor: 'transparent',
                                borderRadius: RFValue(20),
                                height: RFValue(70),
                                overflow: 'hidden',

                                // need to remove safeareaview on iPhone X and newer devices
                                paddingBottom: 0,
                            },
                            tabBarLabelStyle: {
                                paddingBottom: RFValue(10),
                            },

                            tabBarBackground: () => (
                                <BlurView
                                    intensity={80}
                                    // eslint-disable-next-line react-native/no-inline-styles
                                    style={{
                                        ...StyleSheet.absoluteFillObject,
                                        borderTopLeftRadius: RFValue(20),
                                        borderTopRightRadius: RFValue(20),
                                        overflow: 'hidden',
                                        backgroundColor: 'transparent',
                                    }}
                                />
                            ),
                        }}>
                        {matchCreated ? (
                            scoutingType === 'Match Scouting' ? (
                                <Tab.Screen
                                    name="Scouting"
                                    component={ScoutingPageNavigate}
                                    options={{
                                        tabBarIcon: ({color, size}) => (
                                            <Icon
                                                type="Feather"
                                                name="play"
                                                color={color}
                                                size={size}
                                            />
                                        ),
                                    }}
                                />
                            ) : (
                                <Tab.Screen
                                    name="Pit Scouting"
                                    component={PitScoutingPageNavigate}
                                    options={{
                                        tabBarIcon: ({color, size}) => (
                                            <Icon
                                                type="Feather"
                                                name="play"
                                                color={color}
                                                size={size}
                                            />
                                        ),
                                    }}
                                />
                            )
                        ) : (
                            <>
                                <Tab.Screen
                                    screenOptions={
                                        {
                                            // activeBackgroundColor: 'white',
                                            // drawerLabelStyle: {color: 'white'},
                                            // activeTintColor: 'white',
                                        }
                                    }
                                    name="New Match"
                                    component={NewMatchNavigate}
                                    options={{
                                        tabBarIcon: ({color, size}) => (
                                            <Icon
                                                type="Feather"
                                                name="trello"
                                                color={color}
                                                size={size}
                                            />
                                        ),
                                    }}
                                />
                            </>
                        )}
                        <Tab.Screen
                            name="Data"
                            component={DataPageNavigate}
                            options={{
                                tabBarIcon: ({color, size}) => (
                                    <Icon
                                        type="Feather"
                                        name="upload-cloud"
                                        color={color}
                                        size={size}
                                    />
                                ),
                            }}
                        />
                        {/* <Tab.Screen
                            name="Help"
                            component={HelpPageNavigate}
                            options={{
                                tabBarIcon: ({color, size}) => (
                                    <Icon
                                        type="Feather"
                                        name="help-circle" // random value so question mark is used
                                        color={color}
                                        size={size}
                                    />
                                ),
                            }}
                        /> */}
                        <Tab.Screen
                            name={user.name}
                            component={AccountManagementNavigate}
                            options={{
                                tabBarIcon: ({color, size}) => (
                                    <Icon
                                        type="Feather"
                                        name="users"
                                        color={color}
                                        size={size}
                                    />
                                ),
                            }}
                        />
                    </Tab.Navigator>
                ) : (
                    <Tab.Navigator>
                        <Tab.Screen
                            name="Login"
                            component={LoginPageNavigate}
                            options={{
                                headerShown: false,
                            }}
                        />
                    </Tab.Navigator>
                )}
            </NavigationContainer>
        </SafeAreaView>
    );
};

// export default Sentry.wrap(App);
export default App;