import React, { useEffect, useState } from 'react';
import { Input, Container, Divider, Txt, Flex, Spinner } from 'rendition';
import { useDebounce } from 'use-debounce';

import Header from './Header';
import ProductCard from './ProductCard';

import { getOwnerAndRepo } from '../gitHubUriParsing';

const App = () => {
    /**
     * STATE
     */
    const [input, setInput] = useState('');
    // Only validate and search after change events stop firing on input
    const [uri] = useDebounce(input, 1000);
    const [errorMessage, setErrorMessage] = useState('');

    const [models, setModels] = useState(null);
    const [loading, setLoading] = useState(false);

    /**
     * HOOKS
     */

    const mapNumbersToColors = ({ legend, data: model }) => {

        Object.keys(model).map(key => {
            if(model[key].score < legend[0]) {
                model[key] = 'red';
            } else if (model[key].score < legend[1]) {
                model[key] = 'yellow';
            } else {
                console.log(model[key]);
                model[key] = 'green';
            }
        });

        console.log(model);
        return model;
    }

    /**
     * Fetch model from GitHub URI in user input
     * @param {string} URI 
     */
    const fetchModel = async(URI) => {
        const [owner, repo] = getOwnerAndRepo(URI);
        const ownerRepoString = `${owner}/${repo}`;
        const resp = await fetch(`/pulse/${ownerRepoString}`);
        const body = await resp.json();
        if(!resp.ok) {
            throw new Error(body);
        }
        setErrorMessage('');

        const newModel = { ...models };
        if (!newModel[ownerRepoString]) {
            newModel[ownerRepoString] = mapNumbersToColors(body);
        }
        setModels(newModel);
    }

    /**
     * Update model based on GitHub URI in user input
     * @param {string} URI 
     */
    const updateModel = async (URI) => {

        setLoading(true);
        try {
            await fetchModel(URI);
        } catch(e) {
            setErrorMessage(e.message);
        } finally {
            setLoading(false);
        }
    }

    const onClose = (key) => {
        const newModel = { ...models };
        delete newModel[key];
        setModels(newModel);
    }

    useEffect(() => {
        if (!uri) {
            return;
        }

        updateModel(uri);
    }, [uri]);


    /**
     * JSX
     */
    return (
        <Container width={'50%'}>
            <Header />
            <Container>
                <label 
                    fontSize={'1em'} 
                    htmlFor={'github-url'}
                >
                    Enter a GitHub repo URL:
                </label>
                <Input
                    my={'0.5em'}
                    id={'github-url'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    invalid={errorMessage !== ''}
                    autoCorrect={'false'}
                    spellCheck={'false'}
                />
                <Txt color={'red'} height={'1.5em'}>{errorMessage}</Txt>
            </Container>
            <Divider mt={'1em'} pb={'1em'} />
            <Flex alignItems='center' flexDirection='column'>
                <Spinner emphasized show={loading}/>
                {models && <Container mt={'2em'}>
                        {Object.entries(models).reverse().map(([key, model], idx) => {
                            console.log(model);
                            
                            const owner = key.split('/')[0];
                            const repo = key.split('/')[1];
                            
                            return (
                            <ProductCard
                                key={idx}
                                owner={owner}
                                repo={repo}
                                model={model}
                                onClose={() => onClose(key)}
                            />);
                        })}
                </Container>}
            </Flex>
        </Container>
    );
}

export default App;