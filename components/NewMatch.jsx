import React, {useState, useEffect} from 'react';
import {
    ScrollView,
    Text,
    View,
    StyleSheet,
    Dimensions,
    Alert,
} from 'react-native';
import AnimationLoader from '../AnimationLoader';
import Button from './inputs/Button';
import DriveStationUI from './inputs/DriveStationUI';
import {RFValue} from 'react-native-responsive-fontsize';
import AvoidKeyboardContainer from './AvoidKeyboardContainer';
import {SafeAreaView} from 'react-native-safe-area-context';
import DropdownComponent from './inputs/Dropdown';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import CounterInput from 'react-native-counter-input';
import {useDictStore, usePitDict} from '../contexts/dict';
import Icon from 'react-native-vector-icons/Feather';

const NewMatch = ({
    teamData,
    setMatchCreated,
    setTeamNumber,
    setMatchNumber,
    setMatchType,
    setDriveStation,
    setScoutingType,
    scoutingType,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const resetDict = useDictStore(state => state.resetDict);
    const resetPitDict = usePitDict(state => state.resetDict);

    const [teamNumberLocal, setTeamNumberLocal] = useState(null);
    const [matchNumberLocal, setMatchNumberLocal] = useState(null);
    const [matchTypeLocal, setMatchTypeLocal] = useState(null);
    const [driveStationLocal, setDriveStationLocal] = useState(null);

    const checkFilledOut = () => {
        return (
            teamNumberLocal !== null &&
            matchNumberLocal !== null &&
            matchTypeLocal !== null &&
            driveStationLocal !== null
        );
    };

    const handleStartScouting = async () => {
        resetDict(); // resets dict to default so match data doesnt overlap
        resetPitDict();
        if (scoutingType === 'Match Scouting') {
            if (checkFilledOut()) {
                setIsLoading(true);
                setTimeout(async () => {
                    setTeamNumber(teamNumberLocal);
                    setMatchNumber(matchNumberLocal);
                    setMatchType(matchTypeLocal);
                    setDriveStation(driveStationLocal);
                    setMatchCreated(true);
                    setIsLoading(false);
                }, 1);
            } else {
                Alert.alert('Please fill out all fields.');
            }
        } else if (scoutingType === 'Pit Scouting') {
            if (teamNumberLocal !== null) {
                setIsLoading(true);
                setTimeout(async () => {
                    setTeamNumber(teamNumberLocal);

                    setMatchCreated(true);
                    setIsLoading(false);
                }, 1);
            } else {
                Alert.alert('Please fill out the team number.');
            }
        }
    };

    const matchTypeData = [
        {label: 'Practice', value: 'PRACTICE'},
        {label: 'Qualification', value: 'QUALIFICATION'},
        {label: 'Elimination', value: 'ELIMINATION'},
        {label: 'Finals', value: 'FINALS'},
    ];

    const testTeamData = teamData.team_data.map(item => ({
        label: `${item.nickname} : ${item.team_number}`,
        value: item.team_number,
    }));

    const match_scouting = [
        <>
            <Text
                style={{
                    ...styles.title,
                    marginTop: 0,
                    paddingTop: RFValue(10),
                    fontSize: RFValue(15),
                }}>
                Enter Match Number:
            </Text>
            <CounterInput
                defaultValue={1}
                min={1}
                horizontal={true}
                reverseCounterButtons={true}
                onChange={counter => {
                    setMatchNumberLocal(counter);
                }}
            />

            <DropdownComponent
                data={matchTypeData}
                placeholder={'Select Match Type'}
                onValueChange={value => setMatchTypeLocal(value)}
            />

            <Text
                style={{
                    ...styles.title,
                    marginTop: 0,
                    paddingTop: RFValue(10),
                    fontSize: RFValue(15),
                }}>
                Select Drive Station
            </Text>
            <DriveStationUI
                updateDict={(key, value) => setDriveStationLocal(value)}
            />
        </>,
    ];

    const handleScoutSelect = () => {
        if (scoutingType === 'Match Scouting') {
            setScoutingType('Pit Scouting');
        } else if (scoutingType === 'Pit Scouting') {
            setScoutingType('Match Scouting');
        }
    };

    return (
        <>
            <GestureHandlerRootView style={styles.container}>
                <SafeAreaView
                    style={{
                        flex: 1,
                        paddingBottom: RFValue(40),
                    }}>
                    <AvoidKeyboardContainer>
                        <View style={styles.avoidTabBar}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.title}>New Match</Text>
                                <View style={styles.centerContent}>
                                    <Text
                                        style={{
                                            ...styles.title,
                                            marginTop: 0,
                                            paddingTop: RFValue(10),
                                            fontSize: RFValue(15),
                                        }}>
                                        Select Match Type
                                    </Text>
                                    {/* <Button
                                        label={scoutingType}
                                        onPress={() => handleScoutSelect()}
                                    /> */}
                                    <Icon.Button
                                        padding={RFValue(8)}
                                        borderRadius={5}
                                        name={
                                            scoutingType === 'Match Scouting'
                                                ? 'play'
                                                : 'tag'
                                        }
                                        size={RFValue(25)}
                                        color="white"
                                        alignSelf="center"
                                        backgroundColor="rgba(136, 3, 21, 1)"
                                        underlayColor="transparent"
                                        // fontWeight="bold"
                                        // fontSize="20"
                                        style={{
                                            fontWeight: 'bold',
                                            fontSize: 20,
                                            backgroundColor: 'transparent',
                                            borderColor: 'transparent',
                                            zIndex: 1,
                                        }}
                                        onPress={handleScoutSelect}>
                                        <Text
                                            style={{
                                                fontWeight: 'bold',
                                                fontSize: 20,
                                                color: 'white',
                                            }}>
                                            {scoutingType}
                                        </Text>
                                    </Icon.Button>

                                    <DropdownComponent
                                        data={testTeamData}
                                        placeholder={'Select Team Number'}
                                        onValueChange={value =>
                                            setTeamNumberLocal(value)
                                        }
                                        searchable={true}
                                    />

                                    {scoutingType === 'Match Scouting'
                                        ? match_scouting
                                        : null}

                                    <Button
                                        label={'Create Match'}
                                        onPress={handleStartScouting}
                                    />
                                </View>
                            </ScrollView>
                            <AnimationLoader isLoading={isLoading} />
                        </View>
                    </AvoidKeyboardContainer>
                </SafeAreaView>
            </GestureHandlerRootView>
        </>
    );
};

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
    avoidTabBar: {
        flex: 1,
        backgroundColor: '#121212',
        paddingTop: RFValue(10),
        paddingBottom: RFValue(40),
    },
    // container: {
    //     backgroundColor: '#121212',
    //     padding: 20,
    //     color: 'transparent',
    //     borderTopLeftRadius: RFValue(10),
    //     borderTopRightRadius: RFValue(10),
    //     flex: 1,
    // },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        padding: RFValue(16),
        borderTopLeftRadius: RFValue(16),
        borderTopRightRadius: RFValue(16),
        // paddingBottom: RFValue(120),
    },
    centerContent: {
        borderRadius: RFValue(16),
        paddingTop: RFValue(20),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        padding: RFValue(16),
        width: '100%',
        alignSelf: 'center',
    },

    titleScreen: {
        position: 'absolute',
        // paddingBottom: 500,
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 20,
        color: 'white',
        textAlign: 'center',
    },
    title: {
        paddingTop: RFValue(50),
        fontSize: RFValue(30),
        fontWeight: 'bold',
        color: 'white', // White text color for dark mode
        marginBottom: RFValue(20),
        textAlign: 'center',
    },
    createMatchButton: {
        backgroundColor: 'lightblue',
        padding: 15,
        borderRadius: 5,
        marginBottom: 20,
        width: RFValue(20),
    },
    buttonText: {
        color: 'black',
        fontSize: 20,
        alignSelf: 'center',
        fontWeight: 'bold',
    },
});

export default NewMatch;
