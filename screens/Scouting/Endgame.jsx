import {StyleSheet, ScrollView, Alert} from 'react-native';
import React, {useState, useEffect} from 'react';
import Section from '../../components/scouting_components/Section';
import Query from '../../components/scouting_components/Query';
import RadioGroup from '../../components/inputs/RadioGroup';
import Button from '../../components/inputs/Button';
import CounterBox from '../../components/inputs/CounterBox';
import {useDictStore} from '../../contexts/dict.jsx';
import Checkbox from '../../components/inputs/Checkbox';
import {SafeAreaView} from 'react-native';

const Endgame = ({endMatch}) => {
    // const dict = useDictStore(state => state.dict);
    const setDict = useDictStore(state => state.setDict);

    const penalties_queries = [
        <Query
            title="Minor Fouls"
            item={<CounterBox onChange={value => setDict('minorFouls', value)} />}
        />,
        <Query
            title="Major Fouls"
            item={<CounterBox onChange={value => setDict('majorFouls', value)} />}
        />,
        <Query
            title="Yellow Cards"
            item={<CounterBox onChange={value => setDict('yellowCards', value)} />}
        />,
        <Query
            title="Red Cards"
            item={<CounterBox onChange={value => setDict('redCards', value)} />}
        />,
    ];

    const defense_queries = [
        <Query
            title="Defense"
            item={
                <RadioGroup
                    buttons={['Yes', 'No']}
                    onChange={value => setDict('didTeamPlayDefense', value)}
                />
            }
        />,
    ];

    const endgame_queries = [
        <SafeAreaView>
            <Query
                title="Position"
                item={
                    <RadioGroup
                        buttons={['Shallow', 'Deep', 'Park', 'None']}
                        onChange={value => setDict('endGame', value)}
                    />
                }
            />
        </SafeAreaView>,
    ];

    const teleop_issues_queries = [
        <Query
            title="Not Moving"
            item={
                <Checkbox
                    onPress={selected =>
                        handleTeleopIssuesQueries(selected, 'NOT_MOVING')
                    }
                />
            }
        />,
        <Query
            title="Lost Connection"
            item={
                <Checkbox
                    onPress={selected =>
                        handleTeleopIssuesQueries(selected, 'LOST_CONNECTION')
                    }
                />
            }
        />,
        <Query
            title="Disabled"
            item={
                <Checkbox
                    onPress={selected =>
                        handleTeleopIssuesQueries(selected, 'DISABLED')
                    }
                />
            }
        />,
    ];

    return (
        <ScrollView>
            <Section
                title={'Endgame'}
                queries={endgame_queries}
                style={[styles.sectionStyle, styles.patternSectionStyle]}
            />
            <Section
                title={'Defense'}
                queries={defense_queries}
                style={styles.sectionStyle}
            />
            <Section
                title={'Penalties'}
                queries={penalties_queries}
                style={[styles.sectionStyle, styles.patternSectionStyle]}
            />
            <Button onPress={endMatch} label="End Match" />
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

export default Endgame;
