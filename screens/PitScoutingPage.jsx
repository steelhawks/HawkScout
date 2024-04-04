import {StyleSheet, View, Alert, ScrollView} from 'react-native';
import React, {useState, useEffect} from 'react';
import Form from '../components/scouting_components/Form';
import {SafeAreaView} from 'react-native-safe-area-context';
import AnimationLoader from '../AnimationLoader';
import Section from '../components/scouting_components/Section';
import Query from '../components/scouting_components/Query';
import fs from 'react-native-fs';
import Button from '../components/inputs/Button';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomTextInput from '../components/inputs/CustomTextInput';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import AvoidKeyboardContainer from '../components/AvoidKeyboardContainer';
import {usePitDict} from '../contexts/dict';
import CameraView from './CameraView';
// import * as ImagePicker from 'expo-image'

const PitScoutingPage = ({setMatchCreated, user, navigation}) => {
    const dict = usePitDict(state => state.dict);
    const setDict = usePitDict(state => state.setDict);

    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [readyToPlaySuccessAnimation, setReadyToPlaySuccessAnimation] =
        useState(false);

    useEffect(() => {
        var date = new Date().getDate();
        var month = new Date().getMonth() + 1;
        var year = new Date().getFullYear();
        var hours = new Date().getHours();
        var min = new Date().getMinutes();
        var sec = new Date().getSeconds();
        setCurrentDate(
            date +
                '/' +
                month +
                '/' +
                year +
                ' ' +
                hours +
                ':' +
                min +
                ':' +
                sec,
        );
    }, []);

    const backConfirm = () => {
        Alert.alert('You have unsaved changes', 'Continue without saving?', [
            {
                text: 'No',
            },
            {
                text: 'Yes',
                onPress: () => setMatchCreated(false),
                style: 'destructive',
            },
        ]);
    };

    const endGame = async () => {
        setReadyToPlaySuccessAnimation(true);
        setIsLoading(true);

        setIsDone(true);
        setDict('timeOfCreation', currentDate);
    };

    useEffect(() => {
        if (isDone) {
            saveToJson(dict);
            setIsLoading(false);
            setIsDone(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDone, dict]);

    const saveToJson = async data => {
        try {
            const docDir = fs.DocumentDirectoryPath;

            const filePath = `${docDir}/PIT-SCOUTING-${user.name.replace(
                /\s/g,
                '',
            )}-${dict.teamNumber}.json`;

            const jsonData = JSON.stringify(data, null, 4);

            await fs.writeFile(filePath, jsonData, 'utf8');

            Alert.alert(
                'Pit Scouting of Team ' + dict.teamNumber + ' saved.',
                '',
                [
                    {text: 'New Match', onPress: () => setMatchCreated(false)},
                    {
                        text: 'View Match',
                        onPress: () => {
                            setMatchCreated(false);
                            navigation.navigate('Data');
                        },
                    },
                    {text: 'OK', onPress: () => setMatchCreated(false)},
                ],
            );
        } catch (error) {
            console.error('Error saving data to file:', error.message);
        }
    };

    const general_queries = [
        <Query
            title="Dimensions (length x width w/ bumpers)"
            item={
                <CustomTextInput
                    label="Dimensions (length x width w/ bumpers)"
                    placeholder="Enter dimensions"
                    onChangeText={text => setDict('dimensions', text)}
                    value={dict.dimensions}
                    keyboardType={'text'}
                />
            }
        />,
        <Query
            title="Weight (lbs)"
            item={
                <CustomTextInput
                    label="Weight (lbs)"
                    placeholder="Enter weight"
                    onChangeText={text => setDict('weight', text)}
                    value={dict.weight}
                    keyboardType={'numeric'}
                />
            }
        />,
        <Query
            title="Drivetrain Type"
            item={
                <CustomTextInput
                    label="Drivetrain Type"
                    placeholder="Enter drivetrain type"
                    onChangeText={text => setDict('drivetrain', text)}
                    value={dict.drivetrain}
                    keyboardType={'text'}
                />
            }
        />,
        <Query
            title="Intake Mechanism"
            item={
                <CustomTextInput
                    label="Intake Mechanism"
                    placeholder="Enter intake mechanism"
                    onChangeText={text => setDict('intake', text)}
                    value={dict.intake}
                    keyboardType={'text'}
                />
            }
        />,
        <Query
            title="Vision System"
            item={
                <CustomTextInput
                    label="Vision System"
                    placeholder="Enter vision system"
                    onChangeText={text => setDict('vision', text)}
                    value={dict.vision}
                    keyboardType={'text'}
                />
            }
        />,
    ];

    const auton_queries = [
        <Query
            title="Auton"
            item={
                <CustomTextInput
                    label="Auton Pathing"
                    placeholder="Enter auton"
                    onChangeText={text => setDict('auton', text)}
                    value={dict.auton}
                    keyboardType={'text'}
                />
            }
        />,
    ];

    const handleExcelQuery = (isSelected, id) => {
        const updatedIssues = isSelected
            ? [...dict.robotExcel, id] // add to array if selected
            : dict.robotExcel.filter(issueId => issueId !== id); // remove from array if deselected

        setDict('robotExcel', updatedIssues);
    };

    const scoring_excel_query = [
        <Query title="What does the robot excel in?" />,
        <Query
            title="AMP"
            item={
                <BouncyCheckbox
                    onPress={selected => handleExcelQuery(selected, 'AMP')}
                />
            }
        />,
        <Query
            title="Speaker"
            item={
                <BouncyCheckbox
                    onPress={selected => handleExcelQuery(selected, 'SPEAKER')}
                />
            }
        />,
    ];

    const scoring_queries = [
        <Query
            title="Can your robot score using trap?"
            item={
                <CustomTextInput
                    label="Can your robot score using trap?"
                    placeholder="Type an explanation"
                    onChangeText={text => setDict('trapScorer', text)}
                    value={dict.trapScorer}
                    keyboardType={'text'}
                />
            }
        />,
    ];

    const form_sections = [
        <Section
            title="General"
            queries={general_queries}
            style={[styles.sectionStyle, styles.patternSectionStyle]}
        />,
        <Section
            title="Auton"
            queries={auton_queries}
            style={[styles.sectionStyle]}
        />,
        <Section
            title="Scoring"
            queries={scoring_queries}
            style={[styles.sectionStyle, styles.patternSectionStyle]}
        />,
        <Section
            title="Scoring Excel"
            queries={scoring_excel_query}
            style={styles.sectionStyle}
        />,
        // <Section title="Camera" queries={[<CameraView />]} />,
    ];

    return (
        <SafeAreaView style={styles.mainView}>
            <AvoidKeyboardContainer>
                <View style={styles.container}>
                    <ScrollView style={{flex: 1}}>
                        <Button onPress={backConfirm} label="Cancel" />
                        <Form sections={form_sections} />
                        <Button onPress={endGame} label="Submit" />
                    </ScrollView>
                </View>
                <AnimationLoader
                    isLoading={readyToPlaySuccessAnimation}
                    loop={false}
                    animationKey={'SUCCESS_01'}
                    onAnimationComplete={() =>
                        setReadyToPlaySuccessAnimation(false)
                    }
                />
            </AvoidKeyboardContainer>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    mainView: {
        backgroundColor: 'black',
        flex: 1,
        justifyContent: 'center',
        paddingBottom: RFValue(100),
        color: 'transparent',
        borderTopLeftRadius: RFValue(10),
        borderTopRightRadius: RFValue(10),
    },
    container: {
        flex: 1,
    },
    sectionStyle: {
        alignItems: 'center',
        width: '100%',
    },
    patternSectionStyle: {
        backgroundColor: 'rgba(136, 3, 21, 1)',
        borderRadius: 20,
        marginBottom: 10,
        marginTop: 10,
    },
    checkboxOnlyStyle: {
        alignItems: 'flex-start', // or 'baseline'
        width: '100%',
        size: 30,
        fillColor: 'green',
        unfillColor: '#FFFFFF',
        iconStyle: {borderColor: 'red', alignSelf: 'flex-start'},
        innerIconStyle: {borderWidth: 2},
        padding: 10,
        textStyle: {
            textDecorationLine: 'none',
            fontFamily: 'JosefinSans-Regular',
        },
        iconStyle: {
            width: 20,
            height: 20,
            borderWidth: 1,
            borderColor: 'black',
            borderRadius: 10,
            margin: 10,
        },
        input: {
            padding: RFValue(10),
            borderRadius: RFValue(5),
            borderColor: 'gray',
            borderWidth: 1,
            marginBottom: RFValue(10),
            color: 'white',
        },
    },
});

export default PitScoutingPage;
