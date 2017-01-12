import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity
} from 'react-native';
import TimeAgo from 'react-native-timeago';
import UpArrow from '../media/arrow_up.png';
import DownArrow from '../media/arrow_down.png';
import UpArrowHighlighted from '../media/arrow_up_highlighted.png';
import DownArrowHighlighted from '../media/arrow_down_highlighted.png';
import PostInfo from './PostInfo';

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginRight: 12,
    marginBottom: 12,
    marginLeft: 12,
    padding: 5,
    backgroundColor: '#c1d9ff'
  },
  options: {
    backgroundColor: '#e2edff',
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    padding: 2
  },
  text: {
    fontSize: 16
  },
  vote: {
    marginRight: 5
  },
  buttons: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  }
});

export default class PostRow extends Component {
  constructor(props) {
    super(props);

    this.state = {
      message: props.message,
      modalVisible: false,
      userVote: props.message.userVote,
      upArrowToggle: UpArrow,
      downArrowToggle: DownArrow
    };

    this.togglePostInfo = this.togglePostInfo.bind(this);
    this.delayedVote = this.throttle(this.postVote, 1000);
  }

  componentWillMount() {
    this.updateArrow();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      message: nextProps.message,
      userVote: nextProps.message.userVote
    });
  }

  togglePostInfo() {
    this.setState((prevState) => {
      return {
        modalVisible: !prevState.modalVisible
      };
    });
  }

  updateArrow() {
    if (this.state.userVote) {
      this.setState({
        upArrowToggle: UpArrowHighlighted
      });
    } else if (this.state.userVote === false) {
      this.setState({
        downArrowToggle: DownArrowHighlighted
      });
    }
  }

  throttle(func, wait) {
    let wasRecentlyInvoked = false;
    let doAgain = false;
    let timerOn = false;
    return () => {
      const context = this;
      if (!timerOn) {
        timerOn = true;
        setTimeout(() => {
          if (doAgain) {
            func.call(context);
          }
          wasRecentlyInvoked = false;
          doAgain = false;
          timerOn = false;
        }, wait);
      }
      if (!wasRecentlyInvoked) {
        func.call(context);
        wasRecentlyInvoked = true;
      } else if (wasRecentlyInvoked && !doAgain) {
        doAgain = true;
      }
    };
  };

  postVote() {
    // send vote state
    fetch('http://127.0.0.1:8000/votes', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vote: this.state.userVote,
        messageId: this.state.messageId,
        userAuth: this.props.userAuth,
        displayName: this.props.username
      })
    })
    .then(() => {
      this.props.getMessages();
    });
  }

  updateVote(clicked) {
    if (this.props.username && this.props.userAuth) {
      let up = 0;
      let down = 0;
      let newState = {};
      let newMessage = {};

      for(let key in this.state.message) {
        newMessage[key] = this.state.message[key];
      }
      if (clicked === 'up') {
        if (this.state.upArrowToggle === UpArrow) {
          up += 1;
          if (this.state.downArrowToggle === DownArrowHighlighted) {
            down -= 1;
          }
          this.setState({
            upArrowToggle: UpArrowHighlighted,
            downArrowToggle: DownArrow,
            userVote: true
          });
        } else if (this.state.upArrowToggle === UpArrowHighlighted) {
          up -= 1;
          this.setState({
            upArrowToggle: UpArrow,
            downArrowToggle: DownArrow,
            userVote: null
          });
        }
      } else if (clicked === 'down') {
        if (this.state.downArrowToggle === DownArrow) {
          down += 1;
          if (this.state.upArrowToggle === UpArrowHighlighted) {
            up -= 1;
          }
          this.setState({
            upArrowToggle: UpArrow,
            downArrowToggle: DownArrowHighlighted,
            userVote: false
          });
        } else if (this.state.downArrowToggle === DownArrowHighlighted) {
          down -= 1;
          this.setState({
            upArrowToggle: UpArrow,
            downArrowToggle: DownArrow,
            userVote: null
          });
        }
      }
      newMessage.upVotes = this.state.message.upVotes + up;
      newMessage.downVotes = this.state.message.downVotes + down;
      this.setState({
        message: newMessage
      }, () => {
        this.delayedVote();
      });
    } else {
      this.props.login();
    }
  }

  postVote() {
    let remove = null;
    if (this.state.userVote === null) {
      remove = true;
    }
    fetch('http://127.0.0.1:8000/votes', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vote: this.state.userVote,
        delete: remove,
        messageId: this.state.message.id,
        userAuth: this.props.userAuth,
        displayName: this.props.username
      })
    })
    .then(() => { });
  }

  render() {
    const text = this.state.message.text;
    const createdAt = this.state.message.createdAt;
    const username = this.state.message.UserDisplayName;
    return (
      <View style={styles.container}>
        <PostInfo
          visible={this.state.modalVisible}
          message={this.state.message}
          togglePostInfo={this.togglePostInfo}
        />
        <TouchableOpacity
          onPress={() => {
            this.togglePostInfo();
          }}
        >
          <Text style={styles.text}>
            {`${username}\n${text}`}
          </Text>
        </TouchableOpacity>
        <View style={styles.options}>
          <TimeAgo time={createdAt} interval={60000} />
          <View style={styles.buttons}>
            <TouchableOpacity onPress={() => { this.updateVote('up'); }}>
              <Image
                style={{ width: 20, height: 20 }}
                source={this.state.upArrowToggle}
                accessibilityLabel="Up vote"
              />
            </TouchableOpacity>
            <Text style={styles.vote}>{this.state.message.upVotes}</Text>
            <TouchableOpacity onPress={() => { this.updateVote('down'); }}>
              <Image
                style={{ width: 20, height: 20 }}
                source={this.state.downArrowToggle}
                accessibilityLabel="Down vote"
              />
            </TouchableOpacity>
            <Text style={styles.vote}>{this.state.message.downVotes}</Text>
          </View>
        </View>
      </View>
    );
  }
};
