import React, { Component } from 'react';
import './App.css';
import * as use from '@tensorflow-models/universal-sentence-encoder';

var client = require('./connection.js');
var indexName = "posts";
var docType = "_doc";

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			id: "",
			nameValue: "",
			dataList: []
		}
	}
	onChangeFunc = (event) => {
		this.setState({
			nameValue: event.target.value
		})
	}

	getElasticSearchData = async (text = '') => {

		// generate word vector to send to es
		// Load the model.
		const model = await use.load();
		  
	  	const embeddings = await model.embed(text);
	  	let vectors = embeddings.arraySync()[0];

	  	console.log(vectors);

		let that = this;

		const scriptQuery = {
	        "script_score": {
	            "query": {"match_all": {}},
	            "script": {
	                "source": "cosineSimilarity(params.query_vector, doc['title_vector']) + 1.0",
	                "params": {"query_vector": vectors}
	            }
	        }
	    }

	    const body={
            "size": 10,
            "query": scriptQuery,
            "_source": {"includes": ["title", "body"]}
        }

        console.log(JSON.stringify(body));

		try {
			const resp = await client.search({
				index: indexName,
				type: docType,
				body
			});

			console.log(resp.hits.hits);
			that.setState({
				dataList: resp.hits.hits
			});
		} catch(e) {
			console.log(e.error);
		}
	}

	handleKeyUp = (evt) => {
		var that = this;
		if (evt.keyCode === 13) {
			evt.persist();
			that.getElasticSearchData(evt.target.value);
		};
	}
	render() {
		return (
			<div className="container">
				<div className="row justify-content-md-center">
					<div className="col-md-8">
						<center><h3 className="main-title">Questions Search</h3></center>
						<hr />
						<div className="input-group mb-3">
							<input
								type="text"
								className="form-control"
								placeholder="Type your question..."
								onKeyUp={this.handleKeyUp}
								value={this.state.nameValue}
								onChange={this.onChangeFunc} />
						</div>

					</div>
				</div>
				<ul className="list-group">
					{this.state.dataList.map(ch =>
						<li key={"div_" + ch._id} className="list-group-item">
							<label htmlFor="checkbox5">
								{ch._source.title}
							</label>
						</li>
					)}
				</ul>
			</div>

		);
	}
}

export default App;
