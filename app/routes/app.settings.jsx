import {
    Card, Page, Button, TextField, FormLayout, Toast, ButtonGroup
} from "@shopify/polaris";
import { useState } from "react";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import database from "../db.server";


export async function loader() {
    const current_rate = await database.SaveRates.findFirst();
    // get data form database
    if (!current_rate) {
        console.log("No previously saved rates")
    }
    else {
        console.log("Previous-> " + "Gold rate " + current_rate.goldRate + "::" + "GST Rate " + current_rate.gstRate);
    }
    return json(current_rate);
}

export async function action({ request }) {
    let formData = await request.formData();
    formData = Object.fromEntries(formData);
    //udpate database to prisma database
    const dbData = await database.SaveRates.upsert({
        where: {
            id: 1
        },
        update: {
            goldRate: Number(formData.gold22K),
            gstRate: Number(formData.gstrate)
        },
        create: {
            goldRate: Number(formData.gold22K),
            gstRate: Number(formData.gstrate)
        }
    });

    if (!dbData) {
        console.log("Error in update the rate");
    }
    // return updated data
    return json(dbData);
}



export default function Settings() {

    //access the settings data
    const prevRate = useLoaderData();
    const [formState, setFormState] = useState(prevRate);

    const dbData = useLoaderData();
    const [msg, setMsg] = useState(dbData);

    const showMessage = () => {

        if (!dbData) {
            shopify.toast.show('Error! New rate not saved.', {
                duration: 2000,
            });
        }
        else {
            setMsg(true);
            shopify.toast.show('Success! New rate saved.', {
                duration: 2000,
            });
        }
    }

    return (
        <Page>
            <Card>
                <TitleBar title="Settings" />

                <Form method="POST">
                    <FormLayout.Group>
                        <TextField
                            value={formState?.goldRate}
                            label="Gold 22K Rate"
                            type="number"
                            name="gold22K"
                            onChange={
                                (value) => setFormState({ ...formState, goldRate: value })
                            }
                            helpText="Enter the Gold rate for 1/gms">
                        </TextField>

                        <TextField
                            value={formState?.gstRate}
                            label="Enter GST rate"
                            type="number"
                            name="gstrate"
                            onChange={
                                (value) => setFormState({ ...formState, gstRate: value })
                            }
                            helpText="Enter GST rate(No % symbol required)">
                        </TextField>
                    </FormLayout.Group> <br />
                    <ButtonGroup>
                        <Button variant="primary" submit={true} onClick={showMessage}>Save</Button>
                        <Button
                            url="/app/apply">
                            Update Products
                        </Button>
                    </ButtonGroup>
                </Form>
            </Card>
        </Page >
    );
}