import React, { Component } from 'react';
import {  Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'blue',
    marginBottom: 10,
  },
  text: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
  },
});

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      images: [],
    };
    this.crop = this.crop.bind(this);
  }

  pickSingleWithCamera() {
    ImagePicker.openCamera({
      width: 500,
      height: 500,
      mediaType: 'photo',
    })
      .then((image) => {
        this.setState({
          images: [...this.state.images, {
            uri: image.path,
            width: image.width,
            height: image.height,
            mime: image.mime,
          }],
        });
      })
      .catch((e) => console.log("pickSingleWithCamera", e));
  }

  cleanupImages() {
    ImagePicker.clean()
      .then(() => {
        console.log('removed tmp images from tmp directory');
      })
      .catch((e) => {
        console.log("cleanupImages", e);
      });
    this.setState({ images: [] });
  }

  pickMultiple() {
    const MAX_PHOTOS = 6; 

    ImagePicker.openPicker({
      multiple: true,
      waitAnimationEnd: true,
      mediaType: 'photo',
      maxFiles: MAX_PHOTOS - this.state.images.length,
    })
    .then(async (images) => {
      // 
      if(this.state.images.length + images.length > MAX_PHOTOS){
        Alert.alert(
          'You can only upload a total of six photos',
          'Please go back and select 3 photos maximum.'
        );
        return;
      }

      let croppedImages = [];
      for (const  [index, image] of images.entries()) {
        // TODO Clarify: should we not allow adding the same photo twice?
        // if so, here we should check if it is already added in state or previous images
        const isLastImage = index === images.length - 1;
        const croppedImg = await this.crop(image, isLastImage);
        console.log("croppedImg", croppedImg)
        croppedImages = [...croppedImages, {
          uri: croppedImg.path,
          width: croppedImg.width,
          height: croppedImg.height,
          mime: croppedImg.mime,
        }];
      }

      this.setState({
        images: [...this.state.images, ...croppedImages],
      });
    })
    .catch((e) => console.log("pickMultiple", e));
  }

  renderImage(image) {
    return (
      <Image
        style={{ width: 300, height: 300, resizeMode: 'contain' }}
        source={image}
      />
    );
  }

  async crop(imageToCrop, isLastImage) {
    const size = imageToCrop.width < imageToCrop.height ? imageToCrop.width : imageToCrop.height;

    let chooseAnother = false;
    let croppedImg = await ImagePicker.openCropper({
      path: imageToCrop.path,
      width: size,
      height: size,
      // this works only for Android
      cropperToolbarColor: "#000000",
      cropperStatusBarColor: "#000000",

      cropperActiveWidgetColor: "#FF00FF",
      cropperToolbarWidgetColor: "#FFFFFF",

      cropperToolbarTitle: "",

      // this is poor experience on Android
      // enableRotationGesture: true,

      // hideBottomControls: true,

      // Confirm with design team if we want these on Android
      // showCropGuidelines: false,
      // showCropFrame: false,

      // this works only for Android
      // cropperCancelText: "Choose Another",
      // cropperChooseText: isLastImage ? "Confirm" : "Next Photo",

      // this works only for iOS
      cropperCancelText: "Choose Another",
      cropperChooseText: isLastImage ? "Confirm" : "Next Photo",
      loadingLabelText: "Processing...",
    })
    .catch(async (e) => {
      if(e.code === "E_PICKER_CANCELLED") {
        chooseAnother = true;
      } else {
        // log error
        console.log("crop", e);
      }
    });

    if(chooseAnother) {
      croppedImg = await ImagePicker.openPicker({
        multiple: false,
        waitAnimationEnd: true,
        mediaType: 'photo',
      })
      .then(async (image) => {
        // TODO Clarify: should we not allow adding the same photo twice?
        // if so, here we should check if it is already added in state or previous images
        // display an alert and move back to photo picker
        return this.crop(image, isLastImage);
      });
    }

    return croppedImg;
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView>
          {this.state.images
            ? this.state.images.map((i) => (
                <View key={i.uri}>{this.renderImage(i)}</View>
              ))
            : null}
        </ScrollView>

        <TouchableOpacity
          onPress={this.pickMultiple.bind(this)}
          style={styles.button}
        >
          <Text style={styles.text}>Select Multiple from gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => this.pickSingleWithCamera(true)}
          style={styles.button}
        >
          <Text style={styles.text}>
            Select Single With Camera
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={this.cleanupImages.bind(this)}
          style={styles.button}
        >
          <Text style={styles.text}>Cleanup All Images</Text>
        </TouchableOpacity>
      </View>
    );
  }
}