import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import { useWallet } from "use-wallet";
import { config } from "../../utils/config";
import {
  getImageApiList,
  resetAPIDB,
  saveImageApi,
  Url,
} from "../../utils/db/skynet-db/skynetdb";
import AddImageApiDialog from "../github/modals/add-image-api.modal";
import WalletConnectDialog from "../github/modals/wallet.connect.dialog";

const Buttons = () => {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const [openAddNewApiDialog, setOpenAddNewApiDialog] = useState(false);
  const [apiList, setApiList] = useState<Url[]>([]);
  const [selectedApi, setSelectedApi] = useState("");
  const [addButtonDisabled, setAddButtonDisabled] = useState(false);

  const state = Math.random() * Number.MAX_SAFE_INTEGER;
  const authUrl = config.AUTHORIZE_URL;
  const redirectUrl = config.REDIRECT_URL;
  const clientId = config.CLIENT_ID;
  const authURL = `${authUrl}?client_id=${clientId}&state=${state}&redirect_uri=${redirectUrl}`;

  const connectWallet = () => {
    wallet?.reset();
    setOpen(true);
  };

  const definedApis = async () => {
    const _apiList = await getImageApiList();
    setApiList(_apiList || []);
  };

  useEffect(() => {
    definedApis();
  }, [wallet.status]);

  const apiSelected = async (event) => {
    if (event.target.value === "add_new") {
      setOpenAddNewApiDialog(true);
      setAddButtonDisabled(false);
    } else {
      console.log(event.target.value);
      setSelectedApi(event.target.value);
      // 1. Check that the URL returns status: ok
      // 2. add to list
      const response = await axios.get(event.target.value);
      if (response.data.status === "ok") {
      } else {
        toast.error("URL is not a valid Image API url");
      }
    }
  };

  const addNewImageApi = async (name, url) => {
    const exists = apiList.find((api) => api.name === name || api.url === url);
    if (exists) {
      toast("Api Name/Url already exists");
      return;
    }

    try {
      toast("Saving image API...");
      setAddButtonDisabled(true);
      const response = await axios.get(url);
      console.log(response.data);
      if (response.data.status === "ok") {
        await saveImageApi(name, url);
        setOpenAddNewApiDialog(false);
        await definedApis();
        toast("Image API saved");
      } else {
        toast.error("URL is not a valid Image API url");
      }
      setAddButtonDisabled(false);      
    } catch (err) {
      toast("Error adding API: " + err);
      setAddButtonDisabled(false);
    }
  };

  return (
    <Container className="p-3">
      <Row>
        <Col xs={3}>
          <Link href={authURL} passHref={true}>
            <Button size="lg" variant="primary">
              Get Repositories
            </Button>
          </Link>
        </Col>
        <Col xs={3}>
          <Button
            style={{ marginLeft: "15px" }}
            variant="secondary"
            size="lg"
            color="secondary"
            onClick={() => connectWallet()}
          >
            {wallet.isConnected() ? wallet.account : "Connect Wallet"}
          </Button>
        </Col>
        <Col xs={6}>
          <Row>
            <Col xs={8}>
              <Form.Select
                aria-label="Select Generative Art API"
                onChange={apiSelected}
              >
                <option value="">Select Generative Art API</option>
                {apiList.map((api) => {
                  return <option value={api.url}>{api.name}</option>;
                })}
                <option value="add_new">Add</option>
              </Form.Select>
            </Col>
            <Col xs={4}>
              <Button
                style={{ marginLeft: "5px" }}
                variant="secondary"
                color="secondary"
                onClick={() => connectWallet()}
              >
                {wallet.isConnected() ? wallet.account : "Use Selected"}
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
      <WalletConnectDialog open={open} setOpen={setOpen} />
      <AddImageApiDialog
        buttonDisabled={addButtonDisabled}
        addNewImageApi={addNewImageApi}
        open={openAddNewApiDialog}
        setOpen={setOpenAddNewApiDialog}
        onHide={() => setOpenAddNewApiDialog(false)}
      />
    </Container>
  );
};

export default Buttons;
