import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import AnimationLoader from '../AnimationLoader';
import Button from '../components/inputs/Button';
import {useFocusEffect} from '@react-navigation/native';
import {RFValue} from 'react-native-responsive-fontsize';
import fs from 'react-native-fs';
import {GestureHandlerRootView, Swipeable} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {useDictStore, usePitDict} from '../contexts/dict';
import EmptyPage from './EmptyPage';

const DataPage = ({serverIp, navigation, matchCreated}) => {
    // zustand hooks
    // const dict = useDictStore(state => state.dict);
    // const setDict = useDictStore(state => state.setDict);

    const [dict, setDict] = useState({
        eventName: '',
        scouterName: '',
        teamNumber: '',
        matchNumber: '',
        matchType: '', // qualification, practice, or elimination
        driveStation: '',
        alliance: '', // red or blue
        preloaded: null, // true or false
        robotLeft: null, // true or false
        autonSpeakerNotesScored: 0,
        autonAmpNotesScored: 0,
        autonMissed: 0,
        autonNotesReceived: 0,
        droppedNotes: 0,
        autonIssues: [], // NOT_MOVING, STOPPED, OUT_OF_CONTROL, Default: EMPTY
        telopSpeakerNotesScored: 0,
        telopAmpNotesScored: 0,
        telopAmplifiedSpeakerNotes: 0,
        telopSpeakerNotesMissed: 0,
        telopAmpNotesMissed: 0,
        telopNotesReceivedFromHumanPlayer: 0,
        telopNotesReceivedFromGround: 0,
        ferryNotes: 0,
        endGame: 'EMPTY', // PARKED, ONSTAGE, SPOTLIGHT, Default: EMPTY
        trap: 0,
        fouls: 0,
        techFouls: 0,
        yellowCards: 0,
        redCards: 0,
        telopIssues: [], // NOT_MOVING, LOST_CONNECTION, FMS_ISSUES, DISABLED, Default: EMPTY
        didTeamPlayDefense: null, // YES, NO, Default: null
        timeOfCreation: '',
    });

    const [pitDict, setPitDict] = useState({
        eventName: '',
        scouterName: '',
        teamNumber: '',
        matchNumber: 'PIT',
        dimensions: '',
        weight: '',
        drivetrain: '',
        intake: '',
        vision: '',
        auton: '',
        robotExcel: '',
        trapScorer: '',
        timeOfCreation: '',
    });

    // const pitDict = usePitDict(state => state.dict);
    // const setPitDict = usePitDict(state => state.setDict);

    const [isPitScouting, setIsPitScouting] = useState(false);

    const [refreshFlag, setRefreshFlag] = useState(false); // new state variable

    useFocusEffect(
        React.useCallback(() => {
            // fetch and set the list of JSON files in the directory
            fs.readdir(docDir)
                .then(async files => {
                    const jsonFiles = files.filter(file =>
                        file.endsWith('.json'),
                    );
                    setJsonFiles(jsonFiles);
                })
                .catch(error => {
                    console.error('Error reading directory:', error);
                });
        }, [docDir]),
    );

    const docDir = fs.DocumentDirectoryPath;
    const [jsonFiles, setJsonFiles] = useState([]);
    const [jsonSelected, setJsonSelected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Fetch and set the list of JSON files in the directory
        fs.readdir(docDir)
            .then(files => {
                // eslint-disable-next-line no-shadow
                const jsonFiles = files.filter(file => file.endsWith('.json'));
                setJsonFiles(jsonFiles);
            })
            .catch(error => {
                console.error('Error reading directory:', error);
            });
    }, [docDir, refreshFlag]); // include refreshFlag in the dependency array

    const handleJsonSelection = async selectedJson => {
        try {
            const path = fs.DocumentDirectoryPath + '/' + selectedJson;
            console.log('Path to file', path);
            const content = await fs.readFile(path, 'utf8');

            // parses the JSON content and updates the dictionary
            const jsonData = JSON.parse(content);
            console.log('Match Data', jsonData);
            jsonData.matchNumber === 'PIT'
                ? (setPitDict(jsonData), setIsPitScouting(true))
                : (setDict(jsonData), setIsPitScouting(false));

            // updates the boolean to false when the selected json is deselected
            setJsonSelected(prev =>
                prev === selectedJson ? '' : selectedJson,
            );
        } catch (error) {
            console.error('Error reading or parsing JSON file:', error);
        }
    };

    const addSyncedSuffix = async file => {
        try {
            const oldPath = `${docDir}/${file}`;
            const extension = file.split('.').pop(); // Get the file extension
            const newName = `${file.replace(
                `.${extension}`,
                '-synced',
            )}.${extension}`;
            const newPath = `${docDir}/${newName}`;

            await fs.moveFile(oldPath, newPath);

            console.log(`File renamed successfully to ${newName}`);
        } catch (error) {
            console.error('Error renaming file:', error.message);
        }
    };

    const handleSyncDebug = async () => {
        // console.log('JSON Files', jsonFiles);
        for (const json of jsonFiles) {
            console.log('JSON Name', json);
        }
    };

    const handleSync = async () => {
        if (serverIp === '101') {
            Alert.alert(
                'Cannot sync while offline',
                'Please log out and login when on Wi-Fi.',
            );
            return;
        }
        const response = null;

        for (const json of jsonFiles) {
            if (json.endsWith('-synced.json')) {
                console.log(`Found file of ${json} that is already synced`);
                continue;
            }
            const path = fs.DocumentDirectoryPath + '/' + json;
            const content = await fs.readFile(path, 'utf8');
            const jsonData = JSON.parse(content);

            if (!(await syncToServer(jsonData))) {
                Alert.alert('Error syncing files to server');
                return;
            }

            await addSyncedSuffix(json);
        }
        // After successful syncing, set the refresh flag to trigger a re-render
        setRefreshFlag(prev => !prev);

        Alert.alert('Syncing Successful', '', [
            {
                text: 'Create Another Match',
                onPress: () => {
                    navigation.navigate('New Match');
                },
            },
            {text: 'OK'},
        ]);

        if (response) {
            setIsLoading(false);
        }
    };

    const syncToServer = async data => {
        setIsLoading(true);

        try {
            setJsonSelected(false);
            const serverEndpoint = `http://${serverIp}:8080/upload`;

            const response = await fetch(serverEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            console.log('Server Response:', response);

            if (response.ok) {
                console.log('Data successfully synced to server.');
                // if post request is successful continue loop
                return true;
            } else if (!response.ok) {
                console.log(
                    `File ${data} failed to sync due to the server response not being code 200.`,
                );
                Alert.alert(
                    'Non-Code 200 Received from Server',
                    'Failed to sync file due to server not returning an OK code.',
                );
                return false;
            }
        } catch (error) {
            Alert.alert('Error syncing to server: ' + error, '', [
                {text: 'Close'},
            ]);
            console.error('Error syncing to server:', error);
            // if post request fails end the loop
            setIsLoading(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const forceSync = async file => {
        const path = fs.DocumentDirectoryPath + '/' + file;
        const content = await fs.readFile(path, 'utf8');
        const jsonData = JSON.parse(content);

        if (await syncToServer(jsonData)) {
            Alert.alert('File forcefully synced.');
            await addSyncedSuffix(file);
            setRefreshFlag(prev => !prev);
        } else {
            Alert.alert('File failed to sync.');
        }
    };

    const handleSwipeDelete = async file => {
        if (!file.endsWith('-synced.json')) {
            Alert.alert(
                'You have not synced this file. Are you sure you want to delete?',
                'This cannot be recovered',
                [
                    {
                        text: 'Cancel',
                    },
                    {
                        text: 'Delete',
                        onPress: () => {
                            handleDelete(file);
                            setJsonSelected(false);
                        },
                        style: 'destructive',
                    },
                ],
            );

            return;
        }

        Alert.alert(
            'Are you sure you want to delete?',
            'This cannot be recovered',
            [
                {
                    text: 'Cancel',
                },
                {
                    text: 'Delete',
                    onPress: () => {
                        handleDelete(file);
                        setJsonSelected(false);
                    },
                    style: 'destructive',
                },
            ],
        );
    };

    const handleDelete = async file => {
        try {
            // selectedJson = null;
            const filePath = fs.DocumentDirectoryPath + '/' + file;
            await fs.unlink(filePath);

            const updatedFiles = jsonFiles.filter(f => f !== file);
            setJsonFiles(updatedFiles);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const confirmDeleteAll = () => {
        if (jsonFiles.length === 0) {
            Alert.alert('No files to delete');
            return;
        }

        Alert.alert(
            'Are you sure you want to delete all?',
            'This cannot be recovered',
            [
                {
                    text: 'Cancel',
                },
                {
                    text: 'Delete All',
                    onPress: () => {
                        handleDeleteAll(true);
                        setJsonSelected(false);
                    },
                    style: 'destructive',
                },
            ],
        );
    };

    const handleDeleteAll = async () => {
        try {
            // selectedJson = null;
            for (const index in jsonFiles) {
                const json = jsonFiles[index];
                const path = fs.DocumentDirectoryPath + '/' + json;
                await fs.unlink(path);
            }
            setJsonFiles([]);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const matchScouting = [
        <Text style={styles.valueText}>
            Event Name: {dict.eventName}
            {'\n'}
            Scouter Name: {dict.scouterName}
            {'\n'}
            Team Number: {dict.teamNumber}
            {'\n'}
            Match Number: {dict.matchNumber}
            {'\n'}
            Match Type: {dict.matchType}
            {'\n'}
            Drive Station: {dict.driveStation}
            {'\n'}
            Alliance: {dict.alliance}
            {'\n'}
            Preloaded: {dict.preloaded}
            {'\n'}
            Robot Left: {dict.robotLeft}
            {'\n'}
            Auton Speaker Notes Scored: {dict.autonSpeakerNotesScored}
            {'\n'}
            Auton Amp Notes Scored: {dict.autonAmpNotesScored}
            {'\n'}
            Auton Missed: {dict.autonMissed}
            {'\n'}
            Auton Notes Received: {dict.autonNotesReceived}
            {'\n'}
            Auton Issues: {dict.autonIssues}
            {'\n'}
            Telop Speaker Notes Scored: {dict.telopSpeakerNotesScored}
            {'\n'}
            Telop Amp Notes Scored: {dict.telopAmpNotesScored}
            {'\n'}
            Telop Amplified Speaker Notes: {dict.telopAmplifiedSpeakerNotes}
            {'\n'}
            Telop Speaker Notes Missed: {dict.telopSpeakerNotesMissed}
            {'\n'}
            Telop Amp Notes Missed: {dict.telopAmpNotesMissed}
            {'\n'}
            Dropped Notes: {dict.droppedNotes}
            {'\n'}
            Telop Notes Received From Human Player:{' '}
            {dict.telopNotesReceivedFromHumanPlayer}
            {'\n'}
            Telop Notes Received From Ground:{' '}
            {dict.telopNotesReceivedFromGround}
            {'\n'}
            Ferry Notes: {dict.ferryNotes}
            {'\n'}
            End Game: {dict.endGame}
            {'\n'}
            Trap: {dict.trap}
            {'\n'}
            Fouls Received: {dict.fouls}
            {'\n'}
            Tech Fouls Received: {dict.techFouls}
            {'\n'}
            Yellow Cards Received: {dict.yellowCards}
            {'\n'}
            Red Cards Received: {dict.redCards}
            {'\n'}
            Teleop Issues: {dict.telopIssues}
            {'\n'}
            Did Team Play Defense: {dict.didTeamPlayDefense}
            {'\n'}
            Time of Creation: {dict.timeOfCreation}
            {'\n'}
        </Text>,
    ];

    const pitScouting = [
        <Text style={styles.valueText}>
            Event Name: {pitDict.eventName}
            {'\n'}
            Team Number: {pitDict.teamNumber}
            {'\n'}
            Scouter Name: {pitDict.scouterName}
            {'\n'}
            Dimensions: {pitDict.dimensions}
            {'\n'}
            Weight: {pitDict.weight}
            {'\n'}
            Drivetrain: {pitDict.drivetrain}
            {'\n'}
            Intake: {pitDict.intake}
            {'\n'}
            Vision: {pitDict.vision}
            {'\n'}
            Auton: {pitDict.auton}
            {'\n'}
            Robot Excel: {pitDict.robotExcel}
            {'\n'}
            Trap Scorer: {pitDict.trapScorer}
            {'\n'}
            Time of Creation: {pitDict.timeOfCreation}
            {'\n'}
        </Text>,
    ];

    const getFormattedFileName = file => {
        const fileNameParts = file.split('-');

        const teamNumber = fileNameParts[1];

        let matchNumberPart = fileNameParts[2].split('.')[0];
        matchNumberPart = matchNumberPart.replace('-synced', '');

        return `Team ${teamNumber}, Match ${matchNumberPart}`;
    };

    // DOESNT WORK FIX LATER
    // this allows the formatter to handle both pit scouting and match scouting names
    // ex when this code works correctly it fixes the pit scouting names looking like this:
    // Team: SCOUTING, Match: FarhanJamil
    // const getFormattedFileName = file => {
    //     const fileNameParts = file.split('-');

    //     let teamNumber;
    //     let matchNumberPart;

    //     // checking if the file name starts with "PIT-SCOUTING"
    //     if (fileNameParts[0] === 'PIT' && fileNameParts[1] === 'SCOUTING') {
    //         // if it does, then the team number is the 4th element
    //         teamNumber = fileNameParts[3];

    //         // the match number part will be the 4th element, excluding the file extension
    //         matchNumberPart = fileNameParts[4].split('.')[0];
    //     } else {
    //         // if the file name doesn't start with "PIT-SCOUTING"
    //         // then the team number is the 2nd element
    //         teamNumber = fileNameParts[1];

    //         // the match number part will be the 3rd element, excluding the file extension
    //         matchNumberPart = fileNameParts[2].split('.')[0];
    //     }
    //     // remove any unnecessary part from the match number
    //     matchNumberPart = matchNumberPart.replace('-synced', '');

    //     return `Team ${teamNumber}, Match ${matchNumberPart}`;
    // };

    const empty_page = [
        <EmptyPage navigation={navigation} matchCreated={matchCreated} />,
    ];

    const data_page = [
        <>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Previous Matches</Text>
                <View style={styles.centerContent}>
                    <View
                        // eslint-disable-next-line react-native/no-inline-styles
                        style={[styles.centerContent, {flexDirection: 'row'}]}>
                        <Button label="Sync to Server" onPress={handleSync} />
                        <Icon.Button
                            paddingLeft={RFValue(10)}
                            name="trash"
                            size={RFValue(25)}
                            color="white"
                            alignSelf="center"
                            backgroundColor="transparent"
                            underlayColor="transparent"
                            style={{
                                backgroundColor: 'transparent',
                                borderColor: 'transparent',
                                zIndex: 1,
                            }}
                            onPress={confirmDeleteAll}
                        />
                    </View>
                    <View>
                        {jsonFiles.map(file => (
                            <Swipeable
                                overshootFriction={20}
                                key={file}
                                renderLeftActions={() => (
                                    <TouchableOpacity
                                        style={styles.swipeSyncButton}
                                        onPress={() => forceSync(file)}>
                                        <Text style={styles.swipeDeleteText}>
                                            Sync
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                renderRightActions={() => (
                                    <>
                                        <TouchableOpacity
                                            style={styles.swipeDeleteButton}
                                            onPress={() =>
                                                handleSwipeDelete(file)
                                            }>
                                            <Text
                                                style={styles.swipeDeleteText}>
                                                Delete
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}>
                                <Icon
                                    paddingLeft={RFValue(10)}
                                    name={
                                        file.endsWith('-synced.json')
                                            ? 'check-circle'
                                            : 'upload-cloud'
                                    }
                                    size={RFValue(30)}
                                    color={
                                        file.endsWith('-synced.json')
                                            ? 'lightgreen'
                                            : 'white'
                                    }
                                    backgroundColor="transparent"
                                    underlayColor="transparent"
                                    style={{
                                        backgroundColor: 'transparent',
                                        borderColor: 'transparent',
                                        zIndex: 2,
                                        right: 10,
                                        top: 30,
                                    }}
                                />

                                <TouchableOpacity
                                    style={styles.filesButton}
                                    onPress={() => handleJsonSelection(file)}>
                                    <Text style={styles.filesText}>
                                        {getFormattedFileName(file)}
                                    </Text>
                                </TouchableOpacity>
                            </Swipeable>
                        ))}
                    </View>

                    {jsonSelected ? (
                        isPitScouting ? (
                            pitScouting
                        ) : (
                            matchScouting
                        )
                    ) : (
                        <Text style={styles.infoText}>
                            Select a JSON file to view the data
                        </Text>
                    )}
                </View>
            </ScrollView>
            <AnimationLoader isLoading={isLoading} />
        </>,
    ];

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView
                style={{
                    flex: 1,
                    paddingBottom: RFValue(100),
                }}>
                {jsonFiles.length !== 0 ? data_page : empty_page}
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    title: {
        paddingTop: RFValue(50),
        fontSize: RFValue(30),
        fontWeight: 'bold',
        color: 'white', // White text color for dark mode
        marginBottom: RFValue(20),
        textAlign: 'center',
    },
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
    filesButton: {
        // backgroundColor: 'transparent',
        // borderColor: 'transparent',
        zIndex: 1,

        alignSelf: 'center',
        marginTop: RFValue(10),
        textAlign: 'center',
        padding: RFValue(16),
        borderRadius: RFValue(8),
        marginBottom: RFValue(10),
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
        backgroundColor: '#121212',
    },
    filesText: {
        textAlign: 'center',
        color: 'white',
    },
    valueBox: {
        width: '100%',
        backgroundColor: '#121212',
        padding: RFValue(10),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        borderRadius: 16,
    },
    valueText: {
        color: 'white',
        textAlign: 'center',
    },
    infoText: {
        color: 'white',
        textAlign: 'center',
        position: 'absolute',
        bottom: RFValue(-64),
        width: '100%',
        padding: RFValue(8),
        backgroundColor: '#121212',
    },
    swipeDeleteButton: {
        backgroundColor: '#e74c3c',
        padding: RFValue(14),
        borderRadius: RFValue(8),
        width: '50%',
        alignSelf: 'center',
        marginTop: RFValue(10),
        marginBottom: RFValue(-19),
        elevation: 5,
    },
    swipeSyncButton: {
        backgroundColor: 'lightblue',
        padding: RFValue(14),
        borderRadius: RFValue(8),
        width: '50%',
        alignSelf: 'center',
        marginTop: RFValue(10),
        marginBottom: RFValue(-19),
        elevation: 5,
    },
    swipeDeleteText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        alignSelf: 'center',
        fontFamily: 'Arial',
    },
    iconStyle: {
        position: 'relative',
        color: 'white',
        alignSelf: 'center',
    },
    squareButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DataPage;
