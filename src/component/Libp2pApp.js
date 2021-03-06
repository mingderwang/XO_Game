import { useState, useEffect } from "react";
// import 'babel-polyfill'
import Libp2p from "libp2p";
import WebRTCStar from "libp2p-webrtc-star";
import { NOISE } from "libp2p-noise";
import Mplex from "libp2p-mplex";
import Bootstrap from "libp2p-bootstrap";
import PeerId from "peer-id";
import useLocalStorageState from "../customhooks/useLocalStorageState.js";
import Game from "../game/Game.js";
import Loading from "./Loading.js";
import { send, handler, PROTOCOL } from "./Libp2pUtils.js";

// const = require("./Libp2pUtils.js");

const getPeerId = async () => {
  let newPeerId = await PeerId.create();
  let newPeerIdObj = newPeerId.toJSON();
  return await PeerId.createFromJSON(newPeerIdObj);
};
function Libp2pApp() {
  const [libp2p, setLibp2p] = useState(null);
  const [initlibp2p, setInitlibp2p] = useState(false);
  const [peerId, setPeerId] = useState(null);
  const [peerId2, setPeerId2] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  // const [state, dispatch] = useReducer(reducer, initialState, init);

  const updatePeer2 = (peer2) => {
    setPeerId2(peer2);
  };

  const handlePeer2Reset = (peer2) => {
    setPeerId2(null);
  };

  useEffect(() => {
    if (!peerId) {
      getPeerId().then(setPeerId);
      return;
    }
    if (!initlibp2p) {
      (async (peerId) => {
        // Create our libp2p node
        const libp2p = await Libp2p.create({
          peerId,
          addresses: {
            // Add the signaling server address, along with our PeerId to our multiaddrs list
            // libp2p will automatically attempt to dial to the signaling server so that it can
            // receive inbound connections from other peers

            listen: [
              "/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star",
              "/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star",
            ],
          },
          modules: {
            transport: [WebRTCStar],
            connEncryption: [NOISE],
            streamMuxer: [Mplex],
            //   peerDiscovery: [Bootstrap],
          },
          // config: {
          //   peerDiscovery: {
          //     // The `tag` property will be searched when creating the instance of your Peer Discovery service.
          //     // The associated object, will be passed to the service when it is instantiated.
          //     [Bootstrap.tag]: {
          //       enabled: true,
          //       list: [
          //         "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
          //         "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
          //         "/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp",
          //         "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
          //         "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
          //       ],
          //     },
          //   },
          // },
        });

        // UI elements
        // const status = document.getElementById("status");
        // const output = document.getElementById("output");

        // output.textContent = "";

        // function log(txt) {
        //   console.info(txt);
        //   output.textContent += `${txt.trim()}\n`;
        // }

        // Listen for new peers
        // libp2p.on("peer:discovery", (peerId) => {
        //   log(`Found peer ${peerId.toB58String()}`);
        // });

        // Listen for new connections to peers
        // libp2p.connectionManager.on("peer:connect", (connection) => {
        //   log(`Connected to ${connection.remotePeer.toB58String()}`);
        // });

        // Listen for peers disconnecting
        // libp2p.connectionManager.on("peer:disconnect", (connection) => {
        //   log(`Disconnected from ${connection.remotePeer.toB58String()}`);
        // });

        // Add game handler
        libp2p.handle(PROTOCOL, handler);

        //message sender
        libp2p.peerStore.peers.forEach(async (peerData) => {
          // If they dont support the game protocol, ignore
          if (!peerData.protocols.includes(PROTOCOL)) return;

          // If we're not connected, ignore
          const connection = libp2p.connectionManager.get(peerData.id);
          if (!connection) return;

          try {
            const { stream } = await connection.newStream([PROTOCOL]);
            await send("hello", stream);
          } catch (err) {
            console.error(
              "Could not negotiate game protocol stream with peer",
              err
            );
          }
        });

        await libp2p.start();
        // status.innerText = "libp2p started!";
        // log(
        //   `libp2p id is ${libp2p.peerId.toB58String()} amd multiadres is ${libp2p.multiaddrs
        //     .map((addr) => addr.toString())
        //     .join("\n")}`
        // );

        // Export libp2p to the window so you can play with the API
        // window.libp2p = libp2p;
        setLibp2p(libp2p);
        setInitlibp2p(true);
        setLoadingApp(false);
      })(peerId);
    }
  }, [peerId]);

  const sendmessage = async (libp2p) => {
    //message sender
    libp2p.peerStore.peers.forEach(async (peerData) => {
      // If they dont support the game protocol, ignore
      if (!peerData.protocols.includes(PROTOCOL)) return;

      // If we're not connected, ignore
      const connection = libp2p.connectionManager.get(peerData.id);
      if (!connection) return;

      try {
        const { stream } = await connection.newStream([PROTOCOL]);
        let m = JSON.stringify([12, "2121", "sss"]);
        await send(m, stream);
      } catch (err) {
        console.error(
          "Could not negotiate game protocol stream with peer",
          err
        );
      }
    });
  };

  return (
    <div>
      {loadingApp ? (
        <Loading displayMessage={"Loading App"} />
      ) : (
        <Game
          libp2p={libp2p}
          peer1={peerId}
          peer2={peerId2}
          updatePeer2={updatePeer2}
          handlePeer2Reset={handlePeer2Reset}
        />
      )}
    </div>
  );
}

export default Libp2pApp;
