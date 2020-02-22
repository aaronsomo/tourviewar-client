import React, { Component } from "react";
import { connect } from "react-redux";
import { StyleSheet, View } from "react-native";

import axios from 'axios';

import {
  ViroSkyBox,
  Viro360Image,
  ViroUtils,
  ViroARScene,
  ViroConstants,
  ViroNode,
} from "react-viro";

import {Fab, Button, Container, Footer, FooterTab, Input, Item, Text} from 'native-base';

import { setObjectId, setObjectXCoordinate, setObjectYCoordinate, setObjectValue, setObjectScale, setObjectIdPano } from '../redux/object/object.action';
import { selectObjectId, selectObjectXCoordinate, selectObjectYCoordinate, selectObjectValue, selectObjectScale, selectObjectIdPano } from '../redux/object/object.selectors';
import { setPanoId } from '../redux/pano/pano.action';
import { selectPanoId, selectTourPanos } from '../redux/pano/pano.selectors';
import { navigate } from '../redux/render/render.action';
import {selectIsEditable, selectIsNew} from '../redux/tour/tour.selectors';

var ImageElement = require("../custom_controls/ImageElement");
var SceneElement = require("../custom_controls/SceneElement");
var TextElement = require("../custom_controls/TextElement");
let polarToCartesian = ViroUtils.polarToCartesian;

class ARScene extends Component {
  constructor(props) {
    super(props);

    // Set initial state here
    this.state = {
      text: "Initializing AR...",
      editmode: false,
      showtextinput: false,
      objects: [],
      objectname: '',
      currentSceneId: null,
      sceneIdHistory: [],
      selectimage: false
    };
    
    // bind 'this' to functions
    this._onInitialized = this._onInitialized.bind(this);
  }

  componentDidMount() {
      if (!this.props.sceneNavigator.viroAppProps.selectIsNew && this.props.sceneNavigator.viroAppProps.selectIsEditable) {
        axios.get(`http://tourviewarserver.herokuapp.com/api/objects/${this.props.sceneNavigator.viroAppProps.selectTourPanos[0].id}`)
        .then(results => {
            this.setState({objects: results.data, currentSceneId: this.props.sceneNavigator.viroAppProps.selectTourPanos[0].id, sceneIdHistory: [this.props.sceneNavigator.viroAppProps.selectTourPanos[0].id]});
            this.props.sceneNavigator.viroAppProps.setPanoId(this.props.sceneNavigator.viroAppProps.selectTourPanos[0].id);
        })
        .catch(err => {
            alert('There was an error loading this tour. Please try again.');
            this.props.sceneNavigator.viroAppProps.navigate('REACT_NATIVE_HOME');
        });
      } else if (this.props.sceneNavigator.viroAppProps.selectIsNew) {
          this.setState({currentSceneId: this.props.sceneNavigator.viroAppProps.selectTourPanos[0].id, sceneIdHistory: [this.props.sceneNavigator.viroAppProps.selectTourPanos[0].id]});
          this.props.sceneNavigator.viroAppProps.setPanoId(this.props.sceneNavigator.viroAppProps.selectTourPanos[0].id);
      } else {
        axios.get(`http://tourviewarserver.herokuapp.com/api/objects/${this.props.sceneNavigator.viroAppProps.selectTourPanos[0].id}`)
        .then(results => {
            this.setState({objects: results.data, currentSceneId: this.props.sceneNavigator.viroAppProps.selectTourPanos[0].id, sceneIdHistory: [this.props.sceneNavigator.viroAppProps.selectTourPanos[0].id]});
            this.props.sceneNavigator.viroAppProps.setPanoId(this.props.sceneNavigator.viroAppProps.selectTourPanos[0].id);
        })
        .catch(err => {
            alert('There was an error loading this tour. Please try again.');
            this.props.sceneNavigator.viroAppProps.navigate('REACT_NATIVE_HOME');
        });
      }
  }

  render() {
    return (
        <View>
            <View>
        <ViroARScene onTrackingUpdated={this._onInitialized}>
            {
                this.props.sceneNavigator.viroAppProps.selectTourPanos.length ? 
                    (
                        <View>
                            <Viro360Image source={{ uri: this.props.sceneNavigator.viroAppProps.selectTourPanos[0].img_url}}/>
                            {
                                this.state.objects.length ?
                                (
                                    this.state.objects.map((object, i) => {
                                        let toRender;
                                        if (object.type === 'text') {
                                            toRender = (
                                                <ViroNode objectid={object.id} key={i} position={[object.x, object.y, -2]} dragType="FixedToWorld" onDrag={() => this._onDrag}>
                                                    <TextElement content={object.value} contentCardScale={[object.scale.x, object.scale.y, object.scale.z]} position={polarToCartesian([-5, 0, 0])}/>
                                                </ViroNode>
                                            );
                                        } else if (object.type === 'image') {
                                            toRender = (
                                                <ViroNode objectid={object.id} key={i} position={[object.x, object.y, -2]} dragType="FixedToWorld" onDrag={() => this._onDrag}>
                                                    <ImageElement content={object.value} contentCardScale={[object.scale.x, object.scale.y, object.scale.z]} position={polarToCartesian([-5, 0, 0])}/>
                                                </ViroNode>
                                            );
                                        } else {
                                            toRender = null;
                                        }
                                        return toRender;
                                    })
                                ) 
                                : 
                                (
                                    null
                                )
                            }
                        </View>
                    ) 
                    : 
                    (
                        null
                    )
                }
        </ViroARScene>
        </View>
        
        <Container>
                <Footer>
                    <FooterTab>
                    <Fab
                    active={this.state.editmode}
                    direction="up"
                    containerStyle={{ }}
                    style={{ backgroundColor: '#5067FF' }}
                    position="bottomLeft"
                    onPress={() => this.setState({ editmode: !this.state.editmode })}>
                        <Button style={{ backgroundColor: '#34A34F' }}>
                            <Text>{this.state.editmode ? `SAVE` : `EDIT`}</Text>
                        </Button>  
                        <Fab active={this.state.showtextinput} direction='right' onPress={() => this.setState({showtextinput: !this.state.showtextinput})}>
                            <Button style={{ backgroundColor: '#34A34F' }}>
                                <Text>ADD TEXT</Text>
                            </Button>  
                            <Item floatingLabel>
                                <Label>ENTER TEXT VALUE</Label>
                                <Input
                                onChangeText={text => this.setState({objectname: text})}
                                />
                            </Item>
                            <Button onPress={() => {
                                this._createTextObject(this.state.objectname);
                                this.setState({showtextinput: false});
                            }}>
                                <Text>Set Object Text</Text>
                            </Button>
                        </Fab>
                        <Fab>
                            <Button onPress={() => {
                                this.setState({selectimage: !this.state.selectimage})
                            }}>
                                <Text>ADD IMAGE</Text>
                            </Button>
                        <Button style={{ backgroundColor: '#3B5998' }} onPress={() => {
                            this.props.sceneNavigator.viroAppProps.navigate("CAMERA_PAGE_OBJECT")
                        }}>
                        <Text>TAKE PHOTO</Text>
                        </Button>
                        <Button style={{ backgroundColor: '#3B5998' }} onPress={() => {
                            this.props.sceneNavigator.viroAppProps.navigate("IMAGE_PICKER_PAGE_OBJECT")
                        }}>
                        <Text>UPLOAD AN IMAGE</Text>
                        </Button>
                        </Fab>
                        <Button disabled style={{ backgroundColor: '#DD5144' }}>
                        <Text>ADD SCENE</Text>
                        </Button>
                    </Fab>
                    <Fab
                    position="bottomRight"
                    style={{ backgroundColor: '#5067FF' }}
                    onPress={() => {
                        this.props.sceneNavigator.viroAppProps.navigate("PROFILE");
                    }}
                    >
                    <Button style={{backgroundColor: '#3B5998'}}>
                        <Text>CANCEL</Text>
                    </Button>
                    </Fab>
                    </FooterTab>
                </Footer>
            </Container>
        </View>
    )};
 


  _createTextObject(text) {
      axios.post(`http://tourviewarserver.herokuapp.com/api/object`, {
          object_type: 'text',
          object_value: text,
          id_pano: this.props.sceneNavigator.viroAppProps.selectPanoId
      }).then((results) => {
          this.props.sceneNavigator.viroAppProps.setObjectId(results.data.id);
          let textobject = {
              id: results.data.id,
              type: 'text',
              x: 0,
              y: 0, 
              value: text,
              scale: {x: 1, y: 1, z: 1},
              id_pano: this.props.sceneNavigator.viroAppProps.selectPanoId
          };
          this.setState({objects: [...this.state.objects, textobject]});
      }).catch(err => alert('There was an error creating this object'));

  }

  _createImageObject(publicUrl) {
      axios.post(`http://tourviewarserver.herokuapp.com/api/object`, {
          object_type: 'image',
          object_value: publicUrl,
          id_pano: this.props.sceneNavigator.viroAppProps.selectPanoId
      }).then((results) => {
          this.props.sceneNavigator.viroAppProps.setObjectId(results.data.id);
          let textobject = {
              id: results.data.id,
              type: 'image',
              x: 0, 
              y: 0,
              value: publicUrl,
              scale: {x: 1, y: 1, z: 1},
              id_pano: this.props.sceneNavigator.viroAppProps.selectPanoId
          };
          this.setState({objects: [...this.state.objects, textobject]});
      }).catch(err => alert('There was an error creating this object'));
  }

  _onInitialized(state, reason) {
      if (state == ViroConstants.TRACKING_NORMAL) {
        this.setState({text: "ADHd!!!!!"});
      } else if (state == ViroConstants.TRACKING_NONE) {
        // Handle loss of tracking
      }
  }

  _onDrag(draggedToPosition, source) {

    axios.put(`http://tourviewarserver.herokuapp.com/api/object`, {
        x: draggedToPosition[0],
        y: draggedToPosition[1],
        scalex: 1,
        scaley: 1,
        scalez: 1,
        id_object: this.props.selectObjectId
    }).then(results => console.log(results))
    .catch(err => console.log(err));
  }
}

const mapStateToProps = state => {
    return {
        selectObjectId: selectObjectId(state),
        selectObjectXCoordinate: selectObjectXCoordinate(state),
        selectObjectYCoordinate: selectObjectYCoordinate(state),
        selectObjectValue: selectObjectValue(state),
        selectObjectScale: selectObjectScale(state),
        selectObjectIdPano: selectObjectIdPano(state),
        selectPanoId: selectPanoId(state),
        selectTourPanos: selectTourPanos(state),
        selectObjectXCoordinate: selectObjectXCoordinate(state),
        selectObjectYCoordinate: selectObjectYCoordinate(state),
        selectIsEditable: selectIsEditable(state),
        selectIsNew: selectIsNew(state)
    };
};
const mapDispatchToProps = dispatch => {
    return {
        setObjectId: id => dispatch(setObjectId(id)),
        setObjectXCoordinate: x => dispatch(setObjectXCoordinate(x)),
        setObjectYCoordinate: y => dispatch(setObjectYCoordinate(y)),
        setObjectValue: value => dispatch(setObjectValue(value)),
        setObjectScale: scale => dispatch(setObjectScale(scale)),
        setObjectIdPano: idpano => dispatch(setObjectIdPano(idpano)),
        navigate: page => dispatch(navigate(page)),
        setPanoId: id => dispatch(setPanoId(id)),
        setObjectXCoordinate: x => dispatch(setObjectXCoordinate(x)),
        setObjectYCoordinate: y => dispatch(setObjectYCoordinate(y))
    };
};
  
export default connect(mapStateToProps, mapDispatchToProps)(ARScene);
module.exports = ARScene;