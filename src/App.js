import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import abi from './utils/TweetPortal.json';
import './App.css';

export default function App() {
	const [currentAccount, setCurrentAccount] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [allTweets, setAllTweets] = useState([]);

	const contractAddress = '0xc226Ea5DCc46F459973A68c1Bc1A95cb46c0ca8A';
	const contractABI = abi.abi;

	const checkIfWalletIsConnected = async () => {
		/*
    * First make sure we have access to window.ethereum
    */

		try {
			const { ethereum } = window;

			if (!ethereum) {
				console.log('Make sure you have metamask!');
			} else {
				console.log('We have the ethereum object', ethereum);
			}

			const accounts = await ethereum.request({ method: 'eth_accounts' });

			if (accounts.length !== 0) {
				const account = accounts[0];
				console.log('Found an authorized account:', account);
				setCurrentAccount(account);
			} else {
				console.log('No authorized account found');
			}
		} catch (error) {
			console.log(error);
		}
	};

	const connectWallet = async () => {
		try {
			const { ethereum } = window;
			if (!ethereum) {
				alert('Get Metamask');
				return;
			}

			const accounts = await ethereum.request({
				method: 'eth_requestAccounts'
			});

			console.log('Connected ', accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	};

	const tweet = async message => {
		setIsLoading(true);
		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const tweetPortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);

				let count = await tweetPortalContract.getTotalTweets();
				console.log('Retreived total tweet count...', count.toNumber());

				const tweetTxn = await tweetPortalContract.tweet(message);
				console.log('Mining...', tweetTxn.hash);

				await tweetTxn.wait();
				console.log('Mined -- ', tweetTxn.hash);

				count = await tweetPortalContract.getTotalTweets();
				console.log('Retreived total tweet count...', count.toNumber());
				getAllTweets();
				setIsLoading(false);
			} else {
				console.log('Ethereum object doesn´t exist');
				setIsLoading(false);
			}
		} catch (error) {
			console.log(error);
			setIsLoading(false);
		}
	};

	const getAllTweets = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const tweetPortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);

				/*
         * Call the getAllTweets method from your Smart Contract
         */
				const tweets = await tweetPortalContract.getAllTweets();

				/*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
				let tweetsCleaned = [];
				tweets.forEach(tweet => {
					tweetsCleaned.push({
						address: tweet.tweeter,
						timestamp: new Date(tweet.timestamp * 1000),
						message: tweet.message
					});
				});

				tweetsCleaned.reverse();

				/*
         * Store our data in React State
         */
				setAllTweets(tweetsCleaned);
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
		}
	};
	useEffect(() => {
		checkIfWalletIsConnected();
		getAllTweets();
	}, []);

	const handleTweet = () => {
		tweet(message);
		setMessage('');
	};

	return (
		<>
			<div className="mainContainer">
				<div className="dataContainer">
					<h3 className="my-3 header">👋 Twitter on the blockchain</h3>

					<div className="bio my-3">
						Hey there! I'm José Martínez, I'm getting into blockchain
						development by building some cool apps that I found in buildspace.so
					</div>

					<input
						name="message"
						className="form-control"
						value={message}
						onChange={e => setMessage(e.target.value)}
						type="text"
					/>

					{isLoading ? (
						<div className="d-flex align-items-center justify-content-center">
							<div class="spinner-border text-danger" role="status">
								<span class="visually-hidden">Loading...</span>
							</div>
						</div>
					) : (
						<></>
					)}

					<button
						className="btn btn-primary mt-3"
						onClick={() => handleTweet()}
					>
						Tweet something
					</button>

					{/*
        * If there is no currentAccount render this button
        */}
					{!currentAccount && (
						<button className="btn btn-primary" onClick={connectWallet}>
							Connect Wallet
						</button>
					)}

					{allTweets.map((tweet, index) => {
						return (
							<div
								key={index}
								style={{
									backgroundColor: 'black',
									marginTop: '16px',
									padding: '8px',
									color: '#ffffff',
									border: '1px solid gray',
									borderRadius: '5px'
								}}
							>
								<div>Address: {tweet.address}</div>
								<div>Time: {tweet.timestamp.toString()}</div>
								<div>Message: {tweet.message}</div>
							</div>
						);
					})}
				</div>
			</div>
		</>
	);
}
