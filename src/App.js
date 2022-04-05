import { useEffect, useState } from 'react';
import './App.css';
import contract from './contracts/AxolotittoEgg.json';
import { ethers } from 'ethers';
import Grid from '@mui/material/Grid';
import {BrowserView, MobileView} from 'react-device-detect';
import { useAlert } from 'react-alert'

const contractAddress = "0x6394f90c3b24004d538975cbd34dc543edb22291";
const abi = contract.abi;

const NODE_URL = "wss://speedy-nodes-nyc.moralis.io/99051003b96ed60d2117c8f6/polygon/mainnet/ws";
//const NODE_URL = "wss://speedy-nodes-nyc.moralis.io/99051003b96ed60d2117c8f6/polygon/mumbai/ws";

function App() {

  const [currentAccount, setCurrentAccount] = useState(null);

  const [isLive, setIsLive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [num, setNum] = useState(1);
  const [eggPrice, setEggPrice] = useState(1);
  const [eggsMeta, setEggsMeta] = useState([]);
  const [_mintedEggs, setMintedEggs] = useState([]);
  const [claimable, setClaimable] = useState(0);
  const [totalMinted, setTotalMinted] = useState(-1);
  const [totalMintable, setTotalMintable] = useState(0);

  const [isTransact, setisTransact] = useState(false);

  const rarities = ["COMMON", "UNCOMMON", "RARE", "ULTRA RARE"];

  const alert = useAlert();

  document.body.style = 'background: black;';

  const checkWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have Metamask installed!");
      alert.show('Make sure you have Metamask installed!');
      return;
    } else {
      console.log("Wallet exists! We're ready to go!")
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      setCurrentAccount(account);
      addChangeNetwork();
    } else {
      console.log("No authorized account found");
    }
  }

  const connectWalletHandler = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Please install Metamask!");
      alert.show('Please install Metamask!');
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log("Found an account! Address: ", accounts[0]);
      setCurrentAccount(accounts[0]);
      addChangeNetwork();
    } catch (err) {
      console.log(err)
    }
  }

  const addChangeNetwork = () => {
    window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
            chainId: "0x89",
            rpcUrls: ["https://rpc-mainnet.matic.network/"],
            chainName: "Matic Mainnet",
            nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18
            },
            blockExplorerUrls: ["https://polygonscan.com/"]
        }]
    });
    /*window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
            chainId: "0x13881",
            rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
            chainName: "Matic Mainnet",
            nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18
            },
            blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
        }]
    });*/
  }

  const getEggMeta = async () => {
    try {
      const { ethereum } = window;
  
      if (ethereum) {
        const provider = new ethers.providers.WebSocketProvider(NODE_URL);
        let nftContract = new ethers.Contract(contractAddress, abi, provider);
  
        addChangeNetwork();
        let eggPrice = await nftContract.getMintPrice();
        //console.log("eggPrice", eggPrice);
        eggPrice = ethers.utils.formatEther(eggPrice);
        //console.log(eggPrice);
        setEggPrice(eggPrice);

        //
        if (eggsMeta.length === 0) {
          let _eggsMeta = [];
          _eggsMeta = [
            "https://firebasestorage.googleapis.com/v0/b/loteriamexicana.appspot.com/o/Egg_0_COMMON.gif?alt=media&token=d239a404-88da-4eb7-a05e-ad1da568d8fd",
            "https://firebasestorage.googleapis.com/v0/b/loteriamexicana.appspot.com/o/Egg_1_UNCOMMON.gif?alt=media&token=477a4768-0365-4dd8-a0fa-3cddaaf74b64",
            "https://firebasestorage.googleapis.com/v0/b/loteriamexicana.appspot.com/o/Egg_2_RARE.gif?alt=media&token=0bf2b5f9-9081-44ae-9f82-334d00303f5b",
            "https://firebasestorage.googleapis.com/v0/b/loteriamexicana.appspot.com/o/Egg_3_ULTRA%20RARE.gif?alt=media&token=eee40cc5-05db-4c9d-b744-ad3e3118b513"
          ];
          /*for (let i = 0; i < 4; i++) {
             let _uri = await nftContract.uris(i);
             console.log(_uri);
             fetch(_uri)
              .then(res => res.json())
              .then(
                  (data) => {
                      _eggsMeta[i] = data;
                  },
                  (error) => {
                      console.log(error);
                  }
              )
          }*/
          //console.log(_eggsMeta);
          setEggsMeta(_eggsMeta);
        }
      }
    }
    catch (err) {
      console.log(err);
    }
  }

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const mintNftHandler = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        setisTransact(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(contractAddress, abi, signer);

        addChangeNetwork();
        
        const weiValue = ethers.utils.parseUnits(eggPrice, 18);
        console.log("Initialize payment", weiValue.mul(num));
        alert.show('Confirm transaction...');
        let nftTxn = await nftContract.mint(num, { value: weiValue.mul(num), gasLimit: num*300000 });

        console.log("Minting... please wait");
        alert.show('Minting... please wait');
        await nftTxn.wait();

        console.log(`Minted, see transaction: https://polygonscan.com/tx/${nftTxn.hash}`);
        alert.show(`Minting complete!`, {type: 'success'});
        await sleep(5000);
        setisTransact(false);
        window.location.reload();

      } else {
        console.log("Ethereum object does not exist");
      }

    } catch (err) {
      console.log(err);
      alert.show('Error ' + err['message'], {type: 'error'});
      setisTransact(false);
    }
  }

  const claimNftHandler = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        setisTransact(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(contractAddress, abi, signer);

        addChangeNetwork();
        
        alert.show('Confirm transaction...');
        let nftTxn = await nftContract.claimAirdrop({ value: 0, gasLimit: num*2000000 });

        console.log("Minting... please wait");
        alert.show('Minting... please wait');
        await nftTxn.wait();

        console.log(`Minted, see transaction: https://polygonscan.com/tx/${nftTxn.hash}`);
        alert.show(`Minting complete!`, {type: 'success'});
        await sleep(5000);
        setisTransact(false);
        window.location.reload();

      } else {
        console.log("Ethereum object does not exist");
      }

    } catch (err) {
      console.log(err);
      alert.show('Error ' + err['message'], {type: 'error'});
      setisTransact(false);
    }
  }

  const connectWalletButton = () => {
    return (
      <button onClick={connectWalletHandler} className='cta-button connect-wallet-button'>
        Connect Wallet
      </button>
    )
  }

  const mintNftButton = () => {
    if (!checkChain()) { 
      addChangeNetwork();
      return (
        <button onClick={addChangeNetwork} className='cta-button change-network-button'>
          Change to Mumbai Network
        </button>
      )
    }

    if (isPaused) { 
      return (
        <button className='cta-button paused-button'>
          Minting is Paused
        </button>
      )
    }

    if (!isLive) { 
      return (
        <button className='cta-button paused-button'>
          Presale not ready yet
        </button>
      )
    }

    if (Math.round(totalMintable * 0.95) === totalMinted) { 
      return (
        <button className='cta-button sold-out-button'>
          SOLD OUT!
        </button>
      )
    }

    if (isTransact) { 
      return (
        <button className='cta-button transact-button'>
          wait for transaction...
        </button>
      )
    }

    return (
      <div>
        <p className='title'>PHASE {eggPrice > 1 ? eggPrice/5 : ''}</p>
        <div className='price-a'>
          <p className='title'>Price per Egg: {eggPrice} MATIC</p><img src='https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png' className='polygon-icon'></img>
        </div>
        <p className='title'>{totalMinted === -1 ? "" : totalMinted} / {Math.round(totalMintable)} MINTED</p>
        
        {totalMinted === -1 ? <></> : (_mintedEggs.length < 7 ? (
          <div>
            <input
              type="number"
              min={1}
              max={7 - _mintedEggs.length}
              step={1}
              value={num}
              onChange={e => setNum(e.target.value)}
              className="input-qty"
            />
            <button onClick={mintNftHandler} className='cta-button mint-nft-button'>
              🥚Mint {num} Egg(s) - {num*eggPrice} MATIC
            </button>
          </div>
        ) : (
          <div>
            <button className='cta-button limit-nft-button'>
              ❗LIMIT 7 EGGS PER WALLET
            </button>
          </div>
        ))}
      </div>
    )
  }

  const giveawayNftButton = () => {
    if (!checkChain()) { 
      addChangeNetwork();
      return (
        <></>
      )
    }
    
    return (
      <div>
        {claimable === 0 ? <div></div> : (
          <div>
            <button onClick={claimNftHandler} className='cta-button claim-nft-button'>
              🎉Claim {claimable} Egg(s)
            </button>
          </div>)
        }
      </div>
    )
  }

  const getMintedEggs = async () => {
    try {
      const { ethereum } = window;
  
      let isChain = await checkChain();
      if (ethereum && isChain) {
        let accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length !== 0) {
          const account = accounts[0];

          await getEggMeta();

          let provider = new ethers.providers.WebSocketProvider(NODE_URL);
          let nftContract = new ethers.Contract(contractAddress, abi, provider);
          
          addChangeNetwork();

          let userBalance = await nftContract.balanceOf(account);
          userBalance = userBalance.toNumber();
          //console.log("userBalance", userBalance);
          let eggs = [];
          for (let i = 0; i < userBalance; i++) {
            eggs[i] = await nftContract.tokenOfOwnerByIndex(account, i);
            eggs[i] = eggs[i].toNumber();
            eggs[i] = await nftContract.egg_rarity(eggs[i]);
          }
          //console.log(eggs);
          setMintedEggs(eggs)
          
          // giveaway claimable
          let claimable = await nftContract.airdrop_whitelist(account);
          claimable = claimable.toNumber();
          setClaimable(claimable);
          //console.log("claimable", claimable);

          //
          let totalMinted = await nftContract.boughtCount();
          //console.log("totalMinted", totalMinted);
          setTotalMinted(totalMinted.toNumber());
          let totalMintable = await nftContract.mintLimit();
          setTotalMintable(totalMintable.toNumber());

          //
          let _isPaused = await nftContract.paused();
          setIsPaused(_isPaused)

          //
          let _isLive = await nftContract.isSaleLive();
          setIsLive(_isLive)
        }
      }
    }
    catch (err) {
      console.log(err);
    }
  }
  
  const mintedEggs = () => {
    if (_mintedEggs.length === 0 || !checkChain()) return <></>;
    const listItems = _mintedEggs.map((_egg) =>
      <Grid item xs={3}>
        <img src={eggsMeta[_egg]} alt='eggImage' className='eggImage'></img>
        <p className='title'>{rarities[_egg]}</p>
      </Grid>
    );
    return (
      <div className='owned-back'>
        <h1 className='title'>Minted {_mintedEggs.length} Eggs</h1>
        <Grid container spacing={1}>
          {listItems}
        </Grid>
      </div>
    );
  }

  const checkChain = async () => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      let _network = await provider.getNetwork();
      //console.log(_network);
      const chainId = _network["chainId"];
      //console.log("chainId", chainId);
      //console.log(chainId === 80001 || chainId === 137);
      return chainId === 80001 || chainId === 137;
    }
    return false;
  }

  useEffect(() => {
    checkWalletIsConnected();
    getMintedEggs();
  }, [])

  if (!window.ethereum) {
    return (
      <div className='main-app'>
        <img className='logo' src='https://firebasestorage.googleapis.com/v0/b/loteriamexicana.appspot.com/o/axolotto_logo.png?alt=media&token=7822f492-48a2-49c6-881a-50fbe3ecf37d'></img>
        <div>
          <BrowserView>
              <a href='https://metamask.io/download/' target={'_blank'} rel='noreferrer' className='smart-contract' >Install MetaMask</a>
          </BrowserView>
          <MobileView>
              <a href='https://link.trustwallet.com/open_url?coin_id=966&url=https://presale.axolotto.xyz' target={'_blank'} rel='noreferrer' className='smart-contract' >Go to TrustWallet</a>
          </MobileView>
        </div>
      </div>
    )
  }

  window.ethereum.on('accountsChanged', function (accounts) {
    window.location.reload();
  })

  return (
    <div className='main-app'>
      <a href='https://axolotto.xyz'><img className='logo' src='https://firebasestorage.googleapis.com/v0/b/loteriamexicana.appspot.com/o/axolotto_logo.png?alt=media&token=7822f492-48a2-49c6-881a-50fbe3ecf37d'></img></a>
      <div className='mint-back'>
        <h1 className='title'>Axolotitto Egg🥚 - Presale</h1>
        <div>
          <a href={'https://docs.axolotto.xyz/nfts/egg'} target={'_blank'} rel="noreferrer" className='smart-contract'>🎁Get rewards when it hatches!</a>
        </div>
        <div className='discord-ann'>
          <img className='discord-icon' src='https://www.svgrepo.com/show/353655/discord-icon.svg'></img>
          <a href={'https://discord.gg/JH2EaKY7Ff'} target={'_blank'} rel="noreferrer" className='smart-contract'>GET ONE FREE: Join our Discord, #giveaways channel</a>
        </div>
        <br></br>
        {currentAccount ? mintNftButton() : connectWalletButton()}
        {isLive ? (
          <div>
            <h3 className='title'>{currentAccount ? currentAccount : ""}</h3>
            <div>
              {giveawayNftButton()}
            </div>
            <div>
              <a href={'https://polygonscan.com/address/' + contractAddress} target={'_blank'} rel="noreferrer" className='smart-contract'>📘Smart Contract</a>
            </div>
          </div>
        ) : (
          <div></div>
        )}
      </div>

      <span></span>
      
      <div className='eggsGrid'>
        {isLive && currentAccount ? mintedEggs() : <></>}
      </div>
      
      <span></span>
      
      <div>
        <a href='https://docs.axolotto.xyz/first-steps...' target={'_blank'} rel='noreferrer' className='smart-contract' >❓Help</a>
      </div>

      <img className='axolotitto' src="https://firebasestorage.googleapis.com/v0/b/loteriamexicana.appspot.com/o/peace.png?alt=media&token=06b83a5b-2330-40ea-8bd1-82dafb0195ea"></img>
    </div>
  )
}

export default App;
