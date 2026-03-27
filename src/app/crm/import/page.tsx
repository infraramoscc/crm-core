"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle2, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Server Action
import { upsertCompanyFromImport } from "@/app/actions/crm/company-actions";
import { createContact } from "@/app/actions/crm/contact-actions";

type ImportStep = "UPLOAD" | "PREVIEW" | "IMPORTING" | "SUCCESS";

interface ParsedRow {
    [key: string]: string;
}

export default function ImportProspectsPage() {
    const router = useRouter();
    const [step, setStep] = useState<ImportStep>("UPLOAD");
    const [data, setData] = useState<ParsedRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [fileName, setFileName] = useState("");
    const [progress, setProgress] = useState(0);
    const [encoding, setEncoding] = useState("ISO-8859-1");

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setFileName(file.name);

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                encoding: encoding,
                complete: (results) => {
                    setHeaders(results.meta.fields || []);
                    setData(results.data as ParsedRow[]);
                    setStep("PREVIEW");
                },
                error: (error) => {
                    console.error("Error parsing CSV", error);
                    alert("Hubo un error leyendo el archivo. Asegúrate que sea un CSV válido.");
                }
            });
        }
    }, [encoding]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
        },
        maxFiles: 1
    });

    const handleImport = async () => {
        setStep("IMPORTING");

        // Simulación de progreso visual mientras se sube

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            const businessName = row["Razon Social"] || row["Razon_Social"] || row["Empresa"] || row["Nombre"] || "Empresa Sin Nombre";
            const documentNumber = row["RUC"] || row["Documento"] || `0000${i}`;
            const website = row["Web"] || row["Website"] || row["Sitio Web"] || row["Pagina_Web"];
            const annualDamsStr = row["DAMs_Anuales"] || row["DAMs Anuales"] || row["DAMs"];
            const annualDams = annualDamsStr ? parseInt(annualDamsStr, 10) : undefined;
            const legalRepresentative = row["Representante_Legal"] || row["Representante Legal"] || row["Representante"];
            const dominantIncoterm = row["Incoterm_Frecuente"] || row["Incoterm Frecuente"] || row["Incoterm"] || row["Incoterm_Principal"];
            const dominantCustomsChannel = row["Canal_Frecuente"] || row["Canal Frecuente"] || row["Canal"] || row["Canal_Principal"];

            const newCompany = await upsertCompanyFromImport({
                businessName,
                documentNumber,
                website,
                documentType: "RUC",
                companyType: "CLIENT",
                isActive: true,
                prospectingStatus: "COLD",
                annualDams: isNaN(annualDams as number) ? undefined : annualDams,
                dominantIncoterm,
                dominantCustomsChannel,
                legalRepresentative
            });

            if (!newCompany.success) {
                console.warn(`Failed to process row for ${documentNumber}`, newCompany.error);
            }

            // Si importan contacto inicial
            const contactName = row["Contacto"] || row["Nombre Contacto"] || row["Nombres_Contacto"];
            const contactLastName = row["Apellidos_Contacto"] || row["Apellido Contacto"];
            const contactEmail = row["Correo"] || row["Email"] || row["Correos"] || row["Email_Contacto"];
            const contactPhone = row["Telefono"] || row["Celular"] || row["Telefonos"] || row["Telefono_Contacto"];
            const contactPosition = row["Cargo"] || row["Puesto"] || row["Cargo_Contacto"];

            const fullName = contactName ? (contactLastName ? `${contactName} ${contactLastName}` : contactName) : "";

            if (newCompany.success && newCompany.data && (fullName || contactEmail || contactPhone)) {
                await createContact({
                    companyId: newCompany.data.id,
                    firstName: fullName || "Contacto General",
                    emails: contactEmail ? contactEmail.split(',').map(s => s.trim()).filter(Boolean) : [],
                    phones: contactPhone ? contactPhone.split(',').map(s => s.trim()).filter(Boolean) : [],
                    position: contactPosition || "",
                });
            }

            setProgress(Math.round(((i + 1) / data.length) * 100));
        }

        setStep("SUCCESS");
    };

    const cancelImport = () => {
        setData([]);
        setHeaders([]);
        setFileName("");
        setStep("UPLOAD");
    };

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto h-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Importador Masivo de Prospectos</h1>
                <p className="text-muted-foreground mt-1">
                    Sube tus bases de datos de SUNAT o Veritrade en formato CSV para llenar tu Bandeja de Investigación en segundos.
                </p>
            </div>

            {step === "UPLOAD" && (
                <Card className="border-dashed border-2 bg-muted/30">
                    <CardContent>
                        <div
                            {...getRootProps()}
                            className={`flex flex-col items-center justify-center h-64 cursor-pointer rounded-lg transition-colors ${isDragActive ? 'bg-primary/5 border-primary' : 'hover:bg-accent/50'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                                <UploadCloud className={`h-10 w-10 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <p className="text-lg font-medium text-foreground">
                                {isDragActive ? "Suelta el archivo aquí..." : "Haz clic o arrastra un archivo CSV"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Columnas Req: &quot;RUC&quot;, &quot;Razon_Social&quot;. Opcionales: &quot;DAMs_Anuales&quot;, &quot;Representante_Legal&quot;, &quot;Email_Contacto&quot;...
                            </p>

                            <div className="mt-4 flex flex-col items-center gap-4">
                                <div className="flex items-center gap-3 z-10" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-sm font-medium whitespace-nowrap">Codificación:</span>
                                    <Select value={encoding} onValueChange={setEncoding}>
                                        <SelectTrigger className="w-[180px] h-9">
                                            <SelectValue placeholder="Selecciona..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ISO-8859-1">Excel (ISO-8859-1)</SelectItem>
                                            <SelectItem value="UTF-8">Estándar (UTF-8)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="mt-2 text-center pointer-events-none">
                                    <Button type="button" variant="outline" className="pointer-events-none">Buscar archivo</Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === "PREVIEW" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                                <FileSpreadsheet className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-medium">{fileName}</p>
                                <p className="text-sm text-muted-foreground">{data.length} filas detectadas</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={cancelImport}>
                                <X className="h-4 w-4 mr-2" /> Cancelar
                            </Button>
                            <Button onClick={handleImport}>
                                Importar {data.length} Registros <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                Previsualización de Datos
                            </CardTitle>
                            <CardDescription>
                                Revisa que las columnas coincidan antes de procesar la importación. (Mostrando las primeras 5 filas)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {headers.map((h, i) => (
                                                <TableHead key={i} className="whitespace-nowrap">
                                                    {h}
                                                    {/* Pequeña inferencia básica visual */}
                                                    {(h.toLowerCase().includes('ruc') || h.toLowerCase().includes('social')) && (
                                                        <Badge variant="outline" className="ml-2 text-[10px] bg-emerald-50 text-emerald-600">Reconocido</Badge>
                                                    )}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.slice(0, 5).map((row, rowIndex) => (
                                            <TableRow key={rowIndex}>
                                                {headers.map((h, colIndex) => (
                                                    <TableCell key={colIndex} className="truncate max-w-[200px]">
                                                        {row[h]}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === "IMPORTING" && (
                <Card className="text-center py-12">
                    <CardContent className="space-y-6">
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                            <UploadCloud className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold">Procesando Importación...</h2>
                            <p className="text-muted-foreground">Analizando {data.length} registros y buscando duplicados en la base de datos.</p>
                        </div>
                        <div className="max-w-md mx-auto space-y-2">
                            <Progress value={progress} className="h-2" />
                            <p className="text-sm font-medium text-right text-muted-foreground">{progress}%</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === "SUCCESS" && (
                <Card className="text-center py-12 border-emerald-200 bg-emerald-50/50">
                    <CardContent className="space-y-6">
                        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold text-emerald-900">¡Importación Exitosa!</h2>
                            <p className="text-emerald-700/80">
                                Se han añadido <strong>{data.length}</strong> nuevas empresas a tu Bandeja de Investigación.
                            </p>
                        </div>
                        <div className="pt-4 flex justify-center gap-4">
                            <Button variant="outline" onClick={cancelImport}>
                                Importar Otro Archivo
                            </Button>
                            <Button onClick={() => router.push('/crm/investigation')}>
                                Ir a Investigar Leads
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
