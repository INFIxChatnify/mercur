import { Button, Drawer, Input, Text, toast } from "@medusajs/ui";
import { useState } from "react";
import { useCreateSeller } from "../../../hooks/api/seller";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CreateSellerForm({ open, onClose, onSuccess }: Props) {
  const [sellerName, setSellerName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [email, setEmail] = useState("");
  
  const { mutateAsync: createSeller, isPending } = useCreateSeller({
    onSuccess: (data) => {
      if (data.seller) {
        toast.success("Seller created successfully");
        onSuccess?.();
        onClose();
        resetForm();
      } else {
        toast.error("Seller created but returned unexpected data");
      }
    },
    onError: (error) => {
      console.error("Error creating seller:", error);
      toast.error("Failed to create seller");
    }
  });

  const handleSubmit = async () => {
    if (!sellerName || !memberName || !email) {
      toast.error("All fields are required");
      return;
    }

    const sellerData = {
      name: sellerName,
      member: {
        name: memberName,
        email: email,
      },
    };
    
    await createSeller(sellerData);
  };

  const resetForm = () => {
    setSellerName("");
    setMemberName("");
    setEmail("");
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Create new seller</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-6">
          <div className="flex flex-col gap-6">
            <div>
              <Text className="mb-2">Seller name</Text>
              <Input
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Enter the seller's store name"
                required
              />
            </div>
            <div>
              <Text className="mb-2">Member name</Text>
              <Input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Enter the member's name"
                required
              />
            </div>
            <div>
              <Text className="mb-2">Email</Text>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter the member's email"
                required
              />
            </div>
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isPending}>
              Create
            </Button>
          </div>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}
