import {
  Page,
  Card,
  Button,
  Text,
  BlockStack
} from "@shopify/polaris";
import { useState } from "react";

export default function RedeemPoints() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const redeemPoints = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/redeempoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: 18237,
          points: 100,
          orderId: "Ord20895",
        }),
      });

      const data = await res.json();
      setMessage(data.message);
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Redeem Reward Points">
      <Card>
        <BlockStack gap="200">
          <Text variant="headingMd">
            Redeem Employee Points
          </Text>

          <Button
            primary
            loading={loading}
            onClick={redeemPoints}
          >
            Redeem 100 Points
          </Button>

          {message && (
            <Text tone="success">
              {message}
            </Text>
          )}
        </BlockStack>
      </Card>
    </Page>
  );
}
