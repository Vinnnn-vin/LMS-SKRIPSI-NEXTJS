// lmsistts\src\app\certificate\[certificate_number]\PrintButton.tsx

"use client";

import { Button } from "@mantine/core";
import classes from "./Certificate.module.css";

export default function PrintButton() {
  return (
    <Button
      onClick={() => window.print()}
      size="lg"
      className={classes.printButton}
    >
      Print / Download PDF
    </Button>
  );
}