import Head from 'next/head'
import styles from '../styles/Home.module.css'
import stylesMsg from '../styles/Message.module.css'
import API, {GraphQLResult, graphqlOperation} from '@aws-amplify/api';

import { listMessages } from "../src/graphql/queries";
import { createMessage, deleteMessage } from "../src/graphql/mutations";
import { onCreateMessage } from "../src/graphql/subscriptions";
import React, { useEffect, useState } from "react";
import * as APIt from '../src/API';
import Observable from 'zen-observable-ts';

function Home () {
  const initialFruits: APIt.Message[] = [];
  const [stateMessages, setStateMessages] = useState(initialFruits);
  const [messageText, setMessageText] = useState("");
  const [user, setUser] = useState(null);
  const [live, setLive] = useState([
    {
      "id": "bc69fa88-1716-46ad-a54e-16343cb0179d",
      "name": "video-live-1"
    }
  ]);
  useEffect(() => {

     // Subscribe to creation of message
     // Subscriptions is a GraphQL feature allowing the server to send data to its clients when a specific event happens. You can enable real-time data integration in your app with a subscription.
    const pubSubClient = API.graphql(
      graphqlOperation(onCreateMessage)
    ) as Observable<object>;
    const subscription = pubSubClient.subscribe({
      next: (sub: GraphQLResult<APIt.OnCreateMessageSubscription>) => {
        let subMessage = sub?.value;
        console.log('du lieu ne: ',JSON.stringify(subMessage));
        
        setStateMessages((stateMessages) => [
          ...stateMessages,
          subMessage.data.onCreateMessage
        ]);
      },
      error: (error) => console.warn(error)
    });
  }, []);

  useEffect(() => {
    async function getMessages() {
      try {
        const listQV: APIt.ListMessagesQueryVariables = {
        };
        const messagesReq: any = await API.graphql(
          graphqlOperation(listMessages, listQV),
        );
        console.log('messagesReq; ',messagesReq);
        
        setStateMessages(messagesReq.data.listMessages.items);
      } catch (error) {
        console.error(error);
      }
    }
    getMessages();
  }, [user]);

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    // Prevent the page from reloading
    event.preventDefault();

    const input = {
      // id is auto populated by AWS Amplify
      message: messageText, // the message content the user submitted (from state)
      owner: getUrlParameter('name'), // this is the username of the current user
    };

    // clear the textbox
    setMessageText("");

    // Try make the mutation to graphql API
    await API.graphql(graphqlOperation(createMessage, {input: input}));
  };
  
  function insertParam(key: string, value: any) {
    key = encodeURIComponent(key)
;
    value = encodeURIComponent(value);

    var kvp = document.location.search.substr(1).split('&');
    let i=0;

    for(; i<kvp.length; i++){
        if (kvp[i].startsWith(key + '=')) {
            let pair = kvp[i].split('=');
            pair[1] = value;
            kvp[i] = pair.join('=');
            break;
        }
    }

    if(i >= kvp.length){
        kvp[kvp.length] = [key,value].join('=');
    }

    // can return this or...
    let params = kvp.join('&');

    // reload page with new params
    document.location.search = params;
  }

  function getUrlParameter(sParam: string) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return typeof sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
  }

  async function deleteMsg(idDelete: string, e: any) {
    const input = {
      id: idDelete
    };
    const deleteAt: any = await API.graphql(graphqlOperation(deleteMessage, {input: input}));
    console.log(deleteAt);
    if (deleteAt.data) {
      setStateMessages(stateMessages.filter(({ id }) => id !== idDelete));
    }
  }
  // console.log('stateMessages',JSON.stringify(stateMessages));
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>
        <div className={styles.background}>
          <div className={styles.container}>      
          <div className={styles.chatbot}>
              {stateMessages
                // sort messages oldest to newest client-side
                .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
                .map((msg: any, i) => {
                  let isMe = (getUrlParameter('name') === msg.owner);
                  return (
                    <div className={ isMe ? stylesMsg.sentMessageContainer : stylesMsg.receivedMessageContainer } key={i}>
                      <p className={stylesMsg.senderText}>{msg.owner}</p>
                      <div className={isMe ? stylesMsg.sentMessage : stylesMsg.receivedMessage}>
                        <p>{msg.message}</p>
                        <button onClick={(e) => deleteMsg(msg.id, e)}>Delete Row</button>
                      </div>
                    </div>
                  )
                })}
            </div>
            <div className={styles.formContainer}>
              <form onSubmit={handleSubmit} className={styles.formBase}>
                <input
                  type="text"
                  id="message"
                  name="message"
                  autoFocus
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="???? Send a message to the world ????"
                  className={styles.textBox}
                />
                <button style={{ marginLeft: "8px" }}>Send</button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home