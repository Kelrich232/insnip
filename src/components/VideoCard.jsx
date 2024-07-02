import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView, Modal } from 'react-native';
import { Video } from 'expo-av';
import { AntDesign, MaterialIcons, Fontisto, Entypo, Ionicons } from 'react-native-vector-icons';
import { FIRESTORE_DB } from '../../Firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Image } from 'expo-image';
import processUserImage from '../../utils/processUserImage';
import { shareAsync } from 'expo-sharing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const VideoCard = ({ video, isActive }) => {
  const videoRef = useRef(null);
  const [play, setPlay] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [like, setLike] = useState(false);
  const [commentsModal, setCommentsModal] = useState(false);

  const userId = video?.userId;
  const username = video?.username;
  const avatar = video?.avatar;

  useEffect(() => {
    const fetchUserDetails = async (userId) => {
      try {
        const docRef = doc(FIRESTORE_DB, 'users', userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
      return null;
    };

    const manageVideo = async () => {
      if (isActive) {
        videoRef.current.playAsync();
        setPlay(true);
        // const userDetails = await fetchUserDetails(userId);
        // setUserInfo(userDetails);
      } else {
        videoRef.current.stopAsync();
        setPlay(false);
      }
    };

    manageVideo();
  }, [isActive]);

  const togglePlay = () => {
    if (play) {
      videoRef.current.pauseAsync();
    } else {
      videoRef.current.playAsync();
    }
    setPlay(!play);
  };

  const toggleLike = () => {
    setLike(prev => !prev);
  };

  const toggleCommentsModal = () => {
    setCommentsModal(prev => !prev);
  };

  const handleShare = async () => {
    try {
      await shareAsync(video.url, {
        dialogTitle: 'Share this video',
        mimeType: 'video/mp4',
        UTI: 'public.movie'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  

  return (
    <View style={styles.itemContainer}>
      <Video
        ref={videoRef}
        source={{ uri: video.url }}
        style={styles.video}c
        resizeMode=""
        shouldPlay={play}
        isLooping
      />
      <Pressable onPress={togglePlay} style={styles.overlay}>
        {!play && (
          <View style={styles.playIcon}>
            <Entypo name="controller-play" size={70} color="rgba(255,255,255,.5)" />
          </View>
        )}
        <View style={styles.leftControls}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              {/* <Image source={processUserImage(userInfo?.avatar)} style={styles.avatarImage} /> */}
              <Image source={processUserImage(avatar)} style={styles.avatarImage} />
            </View>
            {/* <Text numberOfLines={1} ellipsizeMode='tail' style={styles.username}>{userInfo?.Username || ''}</Text> */}
            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.username}>{username || ''}</Text>
          </View>
        </View>
        <View style={styles.rightControls}>
          <Pressable style={styles.icon}>
            <MaterialIcons name="bookmark-add" size={36} color="white" />
          </Pressable>
          <Pressable onPress={toggleLike} style={styles.icon}>
            <AntDesign name="heart" size={32} color={like ? 'red' : 'white'} />
          </Pressable>
          <Pressable onPress={toggleCommentsModal} style={styles.icon}>
            <MaterialIcons name="mode-comment" size={30} color="white" />
            {/* <Text style={styles.text}>80</Text> */}
          </Pressable>
          <Pressable onPress={handleShare} style={styles.icon}>
            <Fontisto name="share-a" size={28} color="white" />
            {/* <Text style={styles.text}>135</Text> */}
          </Pressable>
          <Pressable style={styles.moreIcon}>
            <Fontisto name="more-v-a" size={25} color="white" style={{ transform: [{ rotate: '90deg' }] }} />
          </Pressable>
        </View>
      </Pressable>
      {commentsModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={commentsModal}
          onRequestClose={toggleCommentsModal}
        >
          <Pressable style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Comments</Text>
                  <Pressable onPress={toggleCommentsModal}>
                    <Ionicons name="close" color="#333333" size={20} />
                  </Pressable>
                </View>
              <ScrollView contentContainerStyle={styles.modalContent}>
                <View style={styles.modalBody}>
                  <Text style={{textAlign: 'center'}}>The creator has turned off comments</Text>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'black',
    paddingBottom: 140,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 16,
    paddingHorizontal: 6,
    height: '100%',
    backgroundColor: 'transparent',
  },
  rightControls: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  icon: {
    marginBottom: 12,
    alignItems: 'center',
  },
  moreIcon: {
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  leftControls: {
    justifyContent: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 30,
    height: 30,
    backgroundColor: '#2ecc71',
    borderRadius: 15,
    marginRight: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  username: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playIcon: {
    position: 'absolute',
    left: '50%',
    top: '55%',
    transform: [{ translateX: -35 }],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 10,
    minHeight: '60%',
  },
  modalContent: {
    flexGrow: 1,
    // justifyContent: 'flex-end',
    paddingBottom: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    fontSize: 16,
    color: 'blue',
  },
  modalBody: {
    paddingTop: 10,
  },
});

export default VideoCard;
