/* eslint-disable react-native/no-inline-styles */
import {StyleSheet, ScrollView} from 'react-native';
import React from 'react';
import Section from '../../components/scouting_components/Section';
import Query from '../../components/scouting_components/Query';
import CounterBox from '../../components/inputs/CounterBox';
import {useDictStore} from '../../contexts/dict.jsx';

const Teleop = () => {
    const setDict = useDictStore(state => state.setDict);

    const reef_scoring_queries = [
        <Query
            title="Coral Scored L4"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('teleopCoralL4', value)
                    }
                />
            }
        />,
        <Query
            title="Coral Scored L3"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('teleopCoralL3', value)
                    }
                />
            }
        />,
        <Query
            title="Coral Scored L2"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('teleopCoralL2', value)
                    }
                />
            }
        />,
        <Query
            title="Coral Scored L1"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('teleopCoralL1', value)
                    }
                />
            }
        />,
    ];

    const algae_scoring_queries = [
        <Query
            title="Net Algae Scored"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('teleopNetAlgaeScored', value)
                    }
                />
            }
        />,
        <Query
            title="Algae Processed"
            item={
                <CounterBox
                    onChange={value => setDict('teleopAlgaeProcessed', value)}
                />
            }
        />,
    ];

    return (
        <ScrollView>
            <Section
                title={'Reef Scoring'}
                queries={reef_scoring_queries}
                style={[
                    styles.sectionStyle,
                    {backgroundColor: 'lightblue'},
                    {borderRadius: 20},
                    {marginBottom: 10},
                    {marginTop: 10},
                ]}
            />
            <Section
                title={'Algae Scoring'}
                queries={algae_scoring_queries}
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

export default Teleop;
