import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../../../Firebase/config';
import { useLocalSearchParams } from 'expo-router';
import { useUser } from '../../../../context/UserContext';
import { pickAndUploadMedia } from '../../../../utils/pickAndUploadMedia';
import { Entypo } from 'react-native-vector-icons';
import Modal from 'react-native-modal';
import { Image as ExpoImage } from 'expo-image';
import { useChatStore } from '../../../../context/ChatContext';
import { Video } from 'expo-av';
import { Ionicons } from 'react-native-vector-icons';
import Header from '../../../components/Chat/Header';
import Bottom from '../../../components/Chat/Bottom';

const { width } = Dimensions.get('window');

const ChatRoom = () => {
  const { userData } = useUser();
  const { chatId, userId, firstname, lastname, avatar, username, user } = useLocalSearchParams();
  const [chat, setChat] = useState(null);
  const [media, setMedia] = useState(null);
  const [localMediaUri, setLocalMediaUri] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [play, setPlay] = useState(false);
  const videoRef = useRef(null);
  const currentUserId = userData.id;
  const { isReceiverBlocked } = useChatStore();
  const scrollViewRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

  useEffect(() => {
    const fetchInitialData = async () => {
      if (chatId) {
        const chatDoc = await getDoc(doc(FIRESTORE_DB, 'chats', chatId));
        if (chatDoc.exists()) {
          setChat(chatDoc.data());
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }

        const unSub = onSnapshot(doc(FIRESTORE_DB, 'chats', chatId), (doc) => {
          setChat(doc.data());
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        });

        return () => {
          unSub();
        };
      }
    };

    fetchInitialData();
  }, [chatId]);

  const handleSend = async (message) => {
    setLocalMediaUri(null);
    try {
      if (!message && !media) return;

      const chatRef = doc(FIRESTORE_DB, 'chats', chatId);

      let messageData = {
        senderId: currentUserId,
        text: message,
        createdAt: new Date(),
      };

      if (media) {
        messageData.mediaUrl = media.url;
        messageData.mediaType = media.type;
      }

      await updateDoc(chatRef, {
        messages: arrayUnion(messageData),
      });

      const userIDs = [currentUserId, userId];

      for (const id of userIDs) {
        const userChatsRef = doc(FIRESTORE_DB, 'userchats', id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

          if (chatIndex !== -1) {
            userChatsData.chats[chatIndex].lastMessage = media ? media.url + message : message;
            userChatsData.chats[chatIndex].isSeen = id === currentUserId;
            userChatsData.chats[chatIndex].updatedAt = new Date();

            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });

            setMedia(null);
          }
        }
      }
    } catch (error) {
      console.log('Error sending message: ' + error);
    }
  };

  const handlePickMedia = async () => {
    try {
      const pickedMedia = await pickAndUploadMedia(setUploadProgress, setLocalMediaUri);
      if (pickedMedia) {
        setMedia(pickedMedia);
      }
    } catch (error) {
      console.log('Error picking media: ' + error);
    }
  };

  const handleLongPress = (message) => {
    setSelectedMessage(message);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedMessage(null);
  };

  const openFullScreen = async () => {
    if (!play) {
      if (!isFullScreen) {
        try {
          await videoRef.current.presentFullscreenPlayer();
          setIsFullScreen(true);
          setPlay(true);
        } catch (error) {
          console.log('Error entering full-screen:', error);
        }
      }
    } else {
      try {
        await videoRef.current.dismissFullscreenPlayer();
        setIsFullScreen(false);
        setPlay(false);
      } catch (error) {
        console.log('Error exiting full-screen:', error);
      }
    }
  };

  const handleDeleteMessage = async () => {
    try {
      const chatRef = doc(FIRESTORE_DB, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        const updatedMessages = chatDoc.data().messages.filter((msg) => msg.text !== selectedMessage.text);

        await updateDoc(chatRef, {
          messages: updatedMessages,
        });

        setIsModalVisible(false);
        setSelectedMessage(null);
      }
    } catch (error) {
      console.log('Error deleting message: ', error);
    }
  };

  const theme = {
    backgroundColor: '#333333',
    primaryColor: '#2ecc71',
    secondaryColor: 'red',
    textColor: 'white',
    modalBackgroundColor: 'white',
    modalTextColor: 'red',
    borderColor: '#00BFFF',
    placeholderColor: 'gray',
    activityIndicatorColor: 'gray',
    fullScreenPlayIconColor: 'rgba(255,255,255,0.7)',
    chatBackgroundImage: require('../../../../assets/chatBackground.png'),
    crossIconColor: 'gray',
    blockUserTextColor: 'white',
    blockUserBackgroundColor: 'rgba(0,0,0,.3)',
    deleteButtonColor: 'red',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <Header title={`${firstname} ${lastname}`} avatar={avatar} firstname={firstname} lastname={lastname} id={userId} username={username} user={user} />
      <ImageBackground source={theme.chatBackgroundImage} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingVertical: 10, paddingHorizontal: 6 }}
            onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
          >
            {chat &&
              chat.messages &&
              chat.messages.map((message, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onLongPress={() => handleLongPress(message)}
                  style={{
                    alignSelf: message.senderId === currentUserId ? 'flex-end' : 'flex-start',
                    padding: 8,
                    borderRadius: 15,
                    borderLeftWidth: message.senderId === currentUserId ? 0 : 4,
                    borderRightWidth: message.senderId === currentUserId ? 4 : 0,
                    borderColor: message.senderId === currentUserId ? theme.primaryColor : theme.secondaryColor,
                    marginBottom: 8,
                    backgroundColor: message.senderId === currentUserId ?  'white' : theme.backgroundColor
                  }}
                >
                  <View style={{ marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 13, color: message.senderId === currentUserId ? theme.primaryColor : theme.secondaryColor }}>
                      {message.senderId === currentUserId ? 'Me' : firstname}
                    </Text>
                    <Text style={{ color: 'gray', fontSize: 10 }}>
                      {message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View>
                    {message.mediaUrl ? (
                      message.mediaType === 'image' ? (
                        <>
                          <ExpoImage
                            source={{ uri: message.mediaUrl }}
                            style={{ width: width * 0.8, height: 200, borderRadius: 20, marginVertical: 5 }}
                            placeholder={{ blurhash }}
                            contentFit="cover"
                            transition={1000}
                          />
                          <Text style={{ letterSpacing: 0.2, fontSize: 15,  color: message.senderId === currentUserId ? theme.backgroundColor : theme.textColor }}>
                            {message.text}
                          </Text>
                        </>
                      ) : (
                        <View>
                          <Video
                            ref={videoRef}
                            source={{ uri: message.mediaUrl }}
                            style={{ width: width * 0.8, height: 200, borderRadius: 20, marginVertical: 5 }}
                            useNativeControls
                            resizeMode="cover"
                            isLooping
                            shouldPlay={play}
                          />
                          {!play && (
                            <Pressable
                              onPress={openFullScreen}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <Ionicons name="play-circle" size={60} color={theme.fullScreenPlayIconColor} />
                            </Pressable>
                          )}
                          <Text style={{ letterSpacing: 0.2, fontSize: 15,  color: message.senderId === currentUserId ? theme.backgroundColor : theme.textColor }}>
                            {message.text}
                          </Text>
                        </View>
                      )
                    ) : (
                      <Text style={{ letterSpacing: 0.2, fontSize: 15,   color: message.senderId === currentUserId ? theme.backgroundColor : theme.textColor}}>
                        {message.text}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            {localMediaUri && (
              <View style={{
                alignSelf: 'center',
                padding: 8,
                paddingTop: 4,
                borderRadius: 20,
                borderWidth: 4,
                borderColor: theme.primaryColor,
                marginBottom: 8,
                backgroundColor: 'white'
              }}>
                <TouchableOpacity onPress={() => {
                  setLocalMediaUri(null);
                  setMedia(null);
                }}>
                  <Entypo name='cross' size={20} color={theme.crossIconColor} style={{ textAlign: 'right' }} />
                </TouchableOpacity>
                {media && media.type === 'image' ? (
                  <ExpoImage
                    source={{ uri: localMediaUri }}
                    style={{ width: width * 0.5, height: 100, borderRadius: 20 }}
                    placeholder={{ blurhash }}
                    contentFit="cover"
                    transition={1000}
                  />
                ) : (
                  <Video
                    source={{ uri: localMediaUri }}
                    style={{ width: width * 0.5, height: 100, borderRadius: 20 }}
                    useNativeControls
                    resizeMode="cover"
                    isLooping
                  />
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <View style={{ padding: 10, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <Text>Upload Progress: {uploadProgress.toFixed(2)}%</Text>
                    <ActivityIndicator size="small" color={theme.activityIndicatorColor} />
                  </View>
                )}
              </View>
            )}
            {isReceiverBlocked && (
              <View style={{ backgroundColor: theme.blockUserBackgroundColor, padding: 10 }}>
                <Text style={{ textAlign: 'center', fontWeight: '500', color: theme.blockUserTextColor, fontSize: 12 }}>
                  You can no longer send or receive messages from this user!
                </Text>
              </View>
            )}
          </ScrollView>
          <Bottom handleSend={handleSend} handlePickImage={handlePickMedia} user={user} />
          <Modal
            isVisible={isModalVisible}
            onBackdropPress={handleCloseModal}
            style={{ justifyContent: 'flex-end', margin: 0 }}>
            <View style={{
              backgroundColor: theme.modalBackgroundColor,
              padding: 20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 50,
              gap: 15
            }}>
              {selectedMessage && (
                <Text style={{ textAlign: 'center', color: theme.modalTextColor }}>{selectedMessage.text}</Text>
              )}
              <Pressable onPress={handleDeleteMessage}>
                <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: theme.deleteButtonColor }}>Delete</Text>
              </Pressable>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default ChatRoom;
