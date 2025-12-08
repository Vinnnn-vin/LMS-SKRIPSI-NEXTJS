// lmsistts\src\app\certificate\[certificate_number]\PrintButton.tsx

"use client";

import { Button } from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";
import classes from "./Certificate.module.css";

export default function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button
      onClick={handlePrint}
      size="lg"
      leftSection={<IconPrinter size={20} />}
      className={classes.printButton}
      variant="filled"
      color="blue"
      style={{
        display: "inline-flex",
        visibility: "visible",
        opacity: 1,
      }}
    >
      Print / Download PDF
    </Button>
  );
}