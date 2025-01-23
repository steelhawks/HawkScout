import {StyleSheet, ScrollView} from 'react-native';
import React from 'react';
import Section from '../../components/scouting_components/Section';
import Query from '../../components/scouting_components/Query';
import CounterBox from '../../components/inputs/CounterBox';
import {useDictStore} from '../../contexts/dict.jsx';

const TeleopReceived = () => {
    const dict = useDictStore(state => state.dict);
    const setDict = useDictStore(state => state.setDict);

    const handleTeleopIssuesQueries = (isSelected, id) => {
        const updatedIssues = isSelected
            ? [...dict.teleopIssues, id] // add to array if selected
            : dict.teleopIssues.filter(issueId => issueId !== id); // remove from array if deselected
        setDict('teleopIssues', updatedIssues);
    };

    const tele_received_queries = [
        <Query
            title="Coral from Human Player"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('teleopCoralFromHumanPlayer', value)
                    }
                />
            }
        />,
        <Query
            title="Algae from Reef"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('teleopAlgaeFromReef', value)
                    }
                />
            }
        />,
        <Query
            title="Algae from Ground"
            item={<CounterBox onChange={value => setDict('teleopAlgaeFromGround', value)} />}
        />,
    ];

    const tele_missed_queries = [
        <Query
            title="Coral Missed"
            item={<CounterBox onChange={value => setDict('teleopCoralMissed', value)} />}
        />,
        <Query
            title="Algae Missed"
            item={<CounterBox onChange={value => setDict('teleopAlgaeMissed', value)} />}
        />,
        <Query
            title="Dropped Coral/Algae"
            item={<CounterBox onChange={value => setDict('teleopCoralAlgaeDropped', value)} />}
        />,
    ]

    return (
        <ScrollView>
            <Section
                title={'Teleop Received'}
                queries={tele_received_queries}
                style={[
                    styles.sectionStyle,
                    {backgroundColor: 'lightblue'},
                    {borderRadius: 20},
                    {marginBottom: 10},
                    {marginTop: 10},
                ]}
            />
            <Section
                title={'Teleop Missed'}
                queries={tele_missed_queries}
                style={[styles.patternSectionStyle]}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
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
});

export default TeleopReceived;
